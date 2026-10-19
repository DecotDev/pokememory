import './style.css';
import { renderProfileView } from './components/profile.js';

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
  const appContainer = document.querySelector('#app');
  
appContainer.innerHTML = `
    <main class="main-container" style="padding: 2rem; font-family: sans-serif; text-align: left;">
      
      <!-- Profile div -->
      <div style="background: #f9f9f9; border: 2px solid #ffcb05; padding: 1.2rem; border-radius: 8px; display: inline-block; margin-bottom: 0.4rem; text-align: center; min-width: 180px;">
        <h3 style="margin-bottom: 0.5rem;"> <span style="color: #2a75bb;">${user.username}</span></h3>
        <p style="margin: 0.5rem 0;">Pokemon:</p>
        <img src="${user.image}" alt="${user.name}" style="width: 80px; height: 80px; object-fit: contain; display: block; margin: 0 auto;" />
        <p style="margin: 0.5rem 0 1rem 0;"><strong>${user.name.toUpperCase()}</strong></p>
        
        <!-- Sign out button -->
        <button id="signout-button" style="width: 100%; padding: 0.5rem 1rem; background-color: #ff5555; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Sign out</button>
      </div>

    </main>
  `;
  //Sign out 
  document.getElementById('signout-button').addEventListener('click', () => {
    sessionStorage.removeItem('poke_session');
    initApp();
  });
}

initApp();