import './style.css';
import { renderProfileView } from './components/profile.js';
import { renderGameView } from './components/game.js';

console.log('PokeMemory started');

// Loads or creates session
function initApp() {
  const savedSession = sessionStorage.getItem('poke_session');

  if (!savedSession) {
    renderProfileView((userSession) => {
      loadGameView(userSession);
    });
  } else {
    const userSession = JSON.parse(savedSession);
    loadGameView(userSession);
  }
}

function loadGameView(user) {
  renderGameView(user);
}

initApp();