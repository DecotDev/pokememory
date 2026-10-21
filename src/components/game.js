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
          <div id="cards-grid" style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));"></div>
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
    cardsGrid.innerHTML = `<p>Loading Pokémon from PokeAPI...</p>`;
    
    const allPokemons = await getAllPokemonList();
    console.log(`Total Pokémon fetched: ${allPokemons.length}`);
    const uniquePairsNeeded = cardsCount / 2;

    const selectedPokemons = [];
    const usedIndices = new Set();

    while (selectedPokemons.length < uniquePairsNeeded) {
      const randomIndex = Math.floor(Math.random() * allPokemons.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        selectedPokemons.push(allPokemons[randomIndex]);
      }
    }

    // 3. Fetch details for each
    const pokemonDetailsPromises = selectedPokemons.map(p => getPokemonDetails(p.name));
    const pokemonDetails = await Promise.all(pokemonDetailsPromises);

    // 4. Duplicate and shuffle
    const deck = [...pokemonDetails, ...pokemonDetails]
      .sort(() => Math.random() - 0.5)
      .map((poke, index) => ({ ...poke, uniqueId: index }));

    // Render cards
    cardsGrid.innerHTML = deck.map(poke => `
      <div class="card" data-name="${poke.name}" style="background: #f0f0f0; border: 2px solid #ccc; border-radius: 8px; height: 100px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <img src="${poke.image}" alt="${poke.name}" style="width: 70px; height: 70px; object-fit: contain;" />
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
  }

  function showError(message) {
    errorFeedback.textContent = message;
    errorFeedback.style.display = "block";
  }
}