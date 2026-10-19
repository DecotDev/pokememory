import { getAllPokemonList, getPokemonDetails } from "../services/pokeApi.js";

export async function renderProfileView(onProfileCreated) {
  const appContainer = document.querySelector("#app");

  // Form
  appContainer.innerHTML = `
    <div class="profile-container" style="max-width: 400px; margin: 2rem auto; padding: 2rem; border: 1px solid #ccc; border-radius: 8px; font-family: sans-serif;">
      <h2>Create user profile</h2>
      
      <form id="profile-form">
        <div style="margin-bottom: 1rem;">
          <label for="username">Username (3 a 15 caracteres):</label><br>
          <input type="text" id="username" required minlength="3" maxlength="15" style="width: 100%; padding: 0.5rem; margin-top: 0.3rem;" />
        </div>

        <div style="margin-bottom: 1rem; position: relative;">
          <label for="pokemon-search">Favourite pokemon:</label><br>
          <input type="text" id="pokemon-search" placeholder="Search pokemon..." autocomplete="off" style="width: 100%; padding: 0.5rem; margin-top: 0.3rem;" />
          <ul id="suggestions-list" style="position: absolute; width: 100%; max-height: 424px; overflow-y: auto; background: white; border: 1px solid #ccc; list-style: none; padding: 0; margin: 0; display: none; z-index: 10;"></ul>
        </div>

        <div id="pokemon-preview" style="text-align: center; margin-bottom: 1rem; display: none;">
          <p>Selected: <strong id="selected-name"></strong></p>
          <img id="selected-img" src="" alt="Favourite pokemon" style="width: 100px; height: 100px; object-fit: contain;" />
        </div>

        <button type="submit" style="width: 100%; padding: 0.75rem; background-color: #ffcb05; border: none; font-weight: bold; cursor: pointer; border-radius: 4px; font-size: 1.1rem;">Create profile</button>
      </form>
    </div>
  `;

  // Realtime search
  const searchInput = document.getElementById("pokemon-search");
  const suggestionsList = document.getElementById("suggestions-list");
  const previewContainer = document.getElementById("pokemon-preview");
  const selectedNameSpan = document.getElementById("selected-name");
  const selectedImg = document.getElementById("selected-img");

  let selectedPokemonData = null;

  const allPokemons = await getAllPokemonList();

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (query.length === 0) {
      suggestionsList.style.display = "none";
      suggestionsList.innerHTML = "";
      return;
    }

    // Slices and searches with query
    const matches = allPokemons
      .filter((p) => p.name.startsWith(query))
      .slice(0, 12);

    if (matches.length === 0) {
      suggestionsList.style.display = "none";
      suggestionsList.innerHTML = "";
      return;
    }

    // Displays sliced list
    suggestionsList.style.display = "block";
    suggestionsList.innerHTML = matches
      .map(
        (p) => `
      <li class="suggestion-item" data-name="${p.name}" style="padding: 0.5rem; cursor: pointer; border-bottom: 1px solid #eee;">
        ${p.name.toUpperCase()}
      </li>
    `,
      )
      .join("");

    // Adds click event to each suggested pokemon and gets its data
    document.querySelectorAll(".suggestion-item").forEach((item) => {
      item.addEventListener("click", async () => {
        const pokemonName = item.getAttribute("data-name");
        searchInput.value = pokemonName;
        suggestionsList.style.display = "none";

        const details = await getPokemonDetails(pokemonName);
        if (details) {
          selectedPokemonData = details;
          selectedNameSpan.textContent = details.name.toUpperCase();
          selectedImg.src = details.image;
          previewContainer.style.display = "block";
        }
      });
    });
  });

  // Validates and saves profile on sessionStorage, continues main execution
  const form = document.getElementById("profile-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();

    if (username.length < 3 || username.length > 15) {
      alert("El nombre de usuario debe tener entre 3 y 15 caracteres.");
      return;
    }

    if (!selectedPokemonData) {
      alert("Debes seleccionar un Pokémon favorito del buscador.");
      return;
    }

    const userSession = {
      username,
      pokemonId: selectedPokemonData.id,
      name: selectedPokemonData.name,
      image: selectedPokemonData.image,
    };

    sessionStorage.setItem("poke_session", JSON.stringify(userSession));

    if (typeof onProfileCreated === "function") {
      onProfileCreated(userSession);
    }
  });
}
