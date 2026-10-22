import { getAllPokemonList, getPokemonDetails } from "../services/pokeApi.js";

export function renderGameView(user) {
  const appContainer = document.querySelector("#app");

  appContainer.innerHTML = `
    <main class="main-container" style="display: flex; gap: 2rem; padding: 2rem; font-family: sans-serif; align-items: flex-start; justify-content: center; flex-wrap: wrap;">
      
      <!-- Profile -->
      <section style="background: #f9f9f9; border: 2px solid #ffcb05; padding: 1.2rem; border-radius: 8px; text-align: center; min-width: 180px;">
        <h3 style="margin-bottom: 0.5rem;"><span style="color: #2a75bb;">${user.username}</span></h3>
        <p style="margin: 0.5rem 0;">Pokemon:</p>
        <img src="${user.image}" alt="${user.name}" style="width: 80px; height: 80px; object-fit: contain; display: block; margin: 0 auto;" />
        <p style="margin: 0.5rem 0 1rem 0;"><strong>${user.name.toUpperCase()}</strong></p>
        
        <button id="signout-button" style="width: 100%; padding: 0.5rem 1rem; background-color: #ff5555; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Sign out</button>
      </section>

      <!-- Game settings -->
      <section style="flex: 1; min-width: 300px; background: #fff; border: 1px solid #ccc; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2>Game Area - PokeMemory</h2>
        <hr style="margin: 1rem 0; border: 0; border-top: 1px solid #eee;">

        <div id="setup-container">
          <h3>Configure your game</h3>
          <form id="game-setup-form" style="margin-top: 1rem;">
            <div style="margin-bottom: 1rem;">
              <label for="num-cards">Number of cards (must be integer, positive and even):</label><br>
              <input type="number" id="num-cards" min="2" max="200" step="2" value="8" style="width: 100%; max-width: 300px; padding: 0.5rem; margin-top: 0.3rem;" />
            </div>
            <button type="submit" style="padding: 0.75rem 1.5rem; background-color: #2a75bb; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 1rem;">Start Game</button>
          </form>
          <p id="error-feedback" style="color: #ff5555; margin-top: 0.5rem; font-weight: bold; display: none;"></p>
        </div>

        <!-- Board and timer div -->
        <div id="board-container" style="margin-top: 1.5rem; display: none;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div id="timer-display" style="font-size: 1.2rem; font-weight: bold; color: #333;">Time: 0m 0s</div>
            <button id="restart-btn" style="padding: 0.5rem 1rem; background-color: #ffcb05; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Restart Game</button>
          </div>
          <div id="cards-grid" style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));"></div>
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

  let timerInterval = null;
  let secondsElapsed = 0;

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
      <div class="card" data-name="${poke.name}" style="background: linear-gradient(135deg, #1b365d 0%, #2a75bb 50%, #0d1b2a 100%); border: 3px solid #ffcb05; border-radius: 8px; height: 100px; display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; box-shadow: 0 3px 6px rgba(0,0,0,0.15);">
        <div class="card-back" style="width: 85%; height: 85%; border: 2px solid rgba(255,255,255,0.8); border-radius: 4px; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, #2a75bb 30%, #0d1b2a 90%);">
          <!-- Pokeball design -->
          <div style="width: 42px; height: 42px; border-radius: 50%; border: 3px solid #111; background: linear-gradient(to bottom, #ee1515 0%, #ee1515 42%, #111 42%, #111 58%, #ffffff 58%, #ffffff 100%); position: relative; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.4);">
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #ffffff; border: 3px solid #111; box-shadow: inset 0 0 2px rgba(0,0,0,0.3);"></div>
          </div>
        </div>
        <img src="${poke.image}" alt="${poke.name}" class="card-img" style="width: 75px; height: 75px; object-fit: contain; display: none;" />
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

    const cardElements = cardsGrid.querySelectorAll('.card');

    cardElements.forEach(card => {
      card.addEventListener('click', () => {
        if (lockBoard) return;
        if (card === firstCard) return;
        if (card.classList.contains('matched')) return;

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

      if (matchedPairsCount === totalPairsNeeded) {
        clearInterval(timerInterval);
        setTimeout(() => {
          alert(`Congratulations! You won the game in ${timerDisplay.textContent}! 🎉`);
        }, 300);
      }
    }

    function unflipCards() {
      lockBoard = true;

      setTimeout(() => {
        // Unflip cards
        firstCard.style.background = 'linear-gradient(135deg, #1b365d 0%, #2a75bb 50%, #0d1b2a 100%)';
        firstCard.style.border = '3px solid #ffcb05';
        firstCard.querySelector('.card-back').style.display = 'flex';
        firstCard.querySelector('.card-img').style.display = 'none';

        secondCard.style.background = 'linear-gradient(135deg, #1b365d 0%, #2a75bb 50%, #0d1b2a 100%)';
        secondCard.style.border = '3px solid #ffcb05';
        secondCard.querySelector('.card-back').style.display = 'flex';
        secondCard.querySelector('.card-img').style.display = 'none';

        resetBoard();
      }, 1000);
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