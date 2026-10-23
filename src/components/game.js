import { getAllPokemonList, getPokemonDetails } from "../services/pokeApi.js";
import { saveGameResult, renderRanking } from "../services/ranking.js";

export function renderGameView(user) {
  const appContainer = document.querySelector("#app");

  appContainer.innerHTML = `
    <main class="main-container">
      
      <!-- Left Sidebar: Profile and Ranking -->
      <div class="sidebar">
        <!-- Profile -->
        <section class="user-card">
          <h1><span>${user.username}</span></h1>
          <p style="margin: 0.8rem 0 0.3rem 0;"><strong>${user.name.toUpperCase()}</strong></p>
          <img src="${user.image}" alt="${user.name}" />
          <br>
          <button id="signout-button" class="btn-danger">Sign out</button>
        </section>

        <!-- Ranking Section -->
        <section class="ranking-section">
          <h3 style="margin-bottom: 0.5rem; font-size: 1rem; text-align: center;">Ranking</h3>
          <div id="ranking-list" style="overflow-x: auto;"></div>
        </section>
      </div>

      <!-- Game settings -->
      <section class="game-section">
        <h2>Game Area</h2>
        <hr class="separator">

        <div id="setup-container">
          <h3>Configure your game</h3>
          <form id="game-setup-form" style="margin-top: 1rem;">
            <div class="setup-form-group">
              <label for="num-cards">Number of cards (must be integer, positive and even):</label><br>
              <input type="number" id="num-cards" class="form-input" min="2" max="200" step="2" value="8" style="max-width: 300px; margin-top: 0.3rem;" />
            </div>
            <button type="submit" class="btn-start">Start Game</button>
          </form>
          <p id="error-feedback" class="error-feedback"></p>
        </div>

        <!-- Board and timer div -->
        <div id="board-container" style="margin-top: 1.5rem; display: none;">
          <div class="board-header">
            <div id="timer-display" class="timer-display">Time: 0m 0s</div>
            <button id="restart-btn" class="btn-restart">Restart Game</button>
          </div>
          <div id="cards-grid" class="cards-grid"></div>
        </div>
      </section>

    </main>
  `;

  // Sign out
  document.getElementById('signout-button').addEventListener('click', () => {
    sessionStorage.removeItem('poke_session');
    window.location.reload();
  });

  const setupForm = document.getElementById('game-setup-form');
  const numCardsInput = document.getElementById('num-cards');
  const errorFeedback = document.getElementById('error-feedback');
  const setupContainer = document.getElementById('setup-container');
  const boardContainer = document.getElementById('board-container');
  const timerDisplay = document.getElementById('timer-display');
  const cardsGrid = document.getElementById('cards-grid');
  const restartBtn = document.getElementById('restart-btn');
  const rankingList = document.getElementById('ranking-list');

  let timerInterval = null;
  let secondsElapsed = 0;
  let lastGameId = null;

  // Render ranking on load
  renderRanking(rankingList, lastGameId);

  setupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawValue = numCardsInput.value;
    const cardsCount = Number(rawValue);

    if (isNaN(cardsCount) || !Number.isInteger(cardsCount)) {
      showError("The value entered must be an integer.");
      return;
    }

    if (cardsCount <= 0) {
      showError("The number of cards must be positive.");
      return;
    }

    if (cardsCount % 2 !== 0) {
      showError("The number of cards must be even to form pairs.");
      return;
    }

    errorFeedback.style.display = "none";
    setupContainer.style.display = "none";
    boardContainer.style.display = "block";

    // Calls function to fetch Pokemons and create board
    await initializeGame(cardsCount);
  });

  restartBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    secondsElapsed = 0;
    timerDisplay.textContent = `Time: 0m 0s`;
    boardContainer.style.display = "none";
    setupContainer.style.display = "block";
    numCardsInput.value = "8";
  });

  async function initializeGame(cardsCount) {
    cardsGrid.innerHTML = `<p>Loading Pokemon from PokeAPI...</p>`;

    // Get all pokemons and get random unique ones
    const allPokemons = await getAllPokemonList();
    const uniquePairsNumber = cardsCount / 2;

    const selectedPokemons = [];
    const usedPokemonIDs = new Set();

    while (selectedPokemons.length < uniquePairsNumber) {
      const randomID = Math.floor(Math.random() * allPokemons.length);
      if (!usedPokemonIDs.has(randomID)) {
        usedPokemonIDs.add(randomID);
        selectedPokemons.push(allPokemons[randomID]);
      }
    }

    // get pokemon details with promise
    const pokemonDetailsPromises = selectedPokemons.map(p => getPokemonDetails(p.name));
    const pokemonDetails = await Promise.all(pokemonDetailsPromises);

    // duplicate and mix
    const deck = [...pokemonDetails, ...pokemonDetails]
      .sort(() => Math.random() - 0.5)
      .map((poke, index) => ({ ...poke, uniqueId: index }));

    // Displays cards unflipped
    cardsGrid.innerHTML = deck.map(poke => `
      <div class="card" data-name="${poke.name}">
        <div class="card-back">
          <!-- Pokeball design -->
          <div class="pokeball">
            <div class="pokeball-center"></div>
          </div>
        </div>
        <img src="${poke.image}" alt="${poke.name}" class="card-img" />
      </div>
    `).join('');

    // Timer
    secondsElapsed = 0;
    clearInterval(timerInterval);
    timerDisplay.textContent = `Time: 0m 0s`;

    timerInterval = setInterval(() => {
      secondsElapsed++;
      const minutes = Math.floor(secondsElapsed / 60);
      const seconds = secondsElapsed % 60;
      timerDisplay.textContent = `Time: ${minutes}m ${seconds}s`;
    }, 1000);

    // Game interaction logic
    let hasFlippedCard = false;
    let lockBoard = false;
    let firstCard = null;
    let secondCard = null;
    let matchedPairsCount = 0;
    const totalPairsNeeded = uniquePairsNumber;
    let gameFinished = false;
    let unflipTimeout = null;

    const cardElements = cardsGrid.querySelectorAll('.card');

    cardElements.forEach(card => {
      card.addEventListener('click', () => {
        if (gameFinished) return;
        if (card.classList.contains('matched')) return;

        // hide cards on 3rd card click
        if (lockBoard && firstCard && secondCard) {
          clearTimeout(unflipTimeout);
          hideCards(firstCard, secondCard);
          resetBoard();
        }

        if (lockBoard) return;
        if (card === firstCard) return;

        // Flip card
        card.style.background = '#f9f9f9';
        card.style.border = '2px solid #ccc';
        card.querySelector('.card-back').style.display = 'none';
        card.querySelector('.card-img').style.display = 'block';

        if (!hasFlippedCard) {
          hasFlippedCard = true;
          firstCard = card;
          return;
        }

        secondCard = card;
        checkForMatch();
      });
    });

    function checkForMatch() {
      const isMatch = firstCard.dataset.name === secondCard.dataset.name;

      if (isMatch) {
        disableCards();
      } else {
        unflipCards();
      }
    }

    function disableCards() {
      firstCard.classList.add('matched');
      secondCard.classList.add('matched');
      matchedPairsCount++;

      resetBoard();

      if (matchedPairsCount === totalPairsNeeded && !gameFinished) {
        gameFinished = true;
        clearInterval(timerInterval);

        // Save result and update ranking
        lastGameId = saveGameResult(user, cardsCount, secondsElapsed, lastGameId);
        renderRanking(rankingList, lastGameId);

        setTimeout(() => {
          alert(`Congratulations! You won the game in ${timerDisplay.textContent}! 🎉`);
        }, 300);
      }
    }

    function hideCards(c1, c2) {
      c1.classList.remove('wrong');
      c2.classList.remove('wrong');
      c1.style.background = '';
      c1.style.border = '';
      c1.querySelector('.card-back').style.display = 'flex';
      c1.querySelector('.card-img').style.display = 'none';

      c2.style.background = '';
      c2.style.border = '';
      c2.querySelector('.card-back').style.display = 'flex';
      c2.querySelector('.card-img').style.display = 'none';
    }

    function unflipCards() {
      lockBoard = true;

      firstCard.classList.add('wrong');
      secondCard.classList.add('wrong');

      unflipTimeout = setTimeout(() => {
        hideCards(firstCard, secondCard);
        resetBoard();
      }, 1500);
    }

    function resetBoard() {
      [hasFlippedCard, lockBoard] = [false, false];
      [firstCard, secondCard] = [null, null];
    }
  }

  function showError(message) {
    errorFeedback.textContent = message;
    errorFeedback.style.display = "block";
  }
}