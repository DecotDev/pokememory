import './style.css';
import { getPokemonDetails } from './services/pokeApi.js';

console.log('PokeMemory initialized successfully!');

async function loadInitialApp() {
  const pokemon = await getPokemonDetails('incineroar');

  if (pokemon) {
    document.querySelector('#app').innerHTML = `
      <main class="main-container">
        <p>PokeAPI test</p>
        <h2> name: ${pokemon.name.toUpperCase()} num: ${pokemon.id}</h2>
        <img src="${pokemon.image}" alt="${pokemon.name}" style="width: 200px; height: 200px; object-fit: contain;" />
      </main>
    `;
  } else {
    document.querySelector('#app').innerHTML = `<p>Error al conectar con la PokeAPI.</p>`;
  }
}

loadInitialApp();