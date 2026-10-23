import { getAllPokemonList, getPokemonDetails } from "../services/pokeApi.js";

export async function renderProfileView(onProfileCreated) {
  const appContainer = document.querySelector("#app");

  // Form
  appContainer.innerHTML = `
    <div class="profile-wrapper">
      <h2>Create user profile</h2>
      
      <form id="profile-form">
        <div class="form-group">
          <label for="username">Username (3 a 15 characters):</label><br>
          <input type="text" id="username" class="form-input" required minlength="3" maxlength="15" />
        </div>

        <div class="form-group">
          <label for="pokemon-search">Favourite pokemon:</label><br>
          <input type="text" id="pokemon-search" class="form-input" placeholder="Search pokemon..." autocomplete="off" />
          <ul id="suggestions-list" class="suggestions-list"></ul>
        </div>

        <div id="pokemon-preview" class="pokemon-preview">
          <p>Selected: <strong id="selected-name"></strong></p>
          <img id="selected-img" src="" alt="Favourite pokemon" />
        </div>

        <button type="submit" class="btn-primary">Create profile</button>
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
      <li class="suggestion-item" data-name="${p.name}">
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
      alert("El nombre de usuario debe tener entre 3 y 15 characters.");
      return;
    }

    if (!selectedPokemonData) {
      alert("You must select a pokemon first.");
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