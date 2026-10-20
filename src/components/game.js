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

      <!-- Game -->
      <section style="flex: 1; min-width: 300px; background: #fff; border: 1px solid #ccc; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2>Game zone - PokeMemory</h2>
        <hr style="margin: 1rem 0; border: 0; border-top: 1px solid #eee;">

        <div id="setup-container">
          <h3>Game settings</h3>
          <form id="game-setup-form" style="margin-top: 1rem;">
            <div style="margin-bottom: 1rem;">
              <label for="num-cards">Number of cards (must be an integer, positive and even):</label><br>
              <input type="number" id="num-cards" min="2" max="200" step="2" value="8" style="width: 100%; max-width: 300px; padding: 0.5rem; margin-top: 0.3rem;" />
            </div>
            <button type="submit" style="padding: 0.75rem 1.5rem; background-color: #2a75bb; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 1rem;">Iniciar Partida</button>
          </form>
          <p id="error-feedback" style="color: #ff5555; margin-top: 0.5rem; font-weight: bold; display: none;"></p>
        </div>

        <div id="board-container" style="margin-top: 1.5rem; display: none;"></div>
      </section>

    </main>
  `;

  // Sign out
  document.getElementById('signout-button').addEventListener('click', () => {
    sessionStorage.removeItem('poke_session');
    window.location.reload();
  });

  // Setup form validation
  const setupForm = document.getElementById('game-setup-form');
  const numCardsInput = document.getElementById('num-cards');
  const errorFeedback = document.getElementById('error-feedback');
  const setupContainer = document.getElementById('setup-container');
  const boardContainer = document.getElementById('board-container');

setupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const rawValue = numCardsInput.value;
    const cardsCount = Number(rawValue);

    if (isNaN(cardsCount) || !Number.isInteger(cardsCount)) {
      showError("The number of cards must be an integer.");
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

    boardContainer.innerHTML = `<p>Game started with <strong>${cardsCount}</strong> cards!</p>`;
  });

  function showError(message) {
    errorFeedback.textContent = message;
    errorFeedback.style.display = "block";
  }
}