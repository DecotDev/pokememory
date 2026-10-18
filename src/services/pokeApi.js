export async function getAllPokemonList() {
  try {
    const response = await fetch("https://pokeapi.co/api/v2/pokemon?");
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching Pokemon list:", error);
    return [];
  }
}

export async function getPokemonDetails(query) {
  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${query.toLowerCase()}`,
    );
    if (!response.ok) throw new Error("Pokemon not found");
    const data = await response.json();

    return {
      id: data.id,
      name: data.name,
      image: data.sprites.other["official-artwork"].front_default,
    };
  } catch (error) {
    console.error(`Error fetching details for ${query}:`, error);
    return null;
  } 
}