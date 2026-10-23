const BASE_URL = 'https://api.tcgdex.dev/v2/fr';

export const getPokemonCard = async (id: string) => {
  try {
  const response = await fetch(`${BASE_URL}/cards/${encodeURIComponent(id)}`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de la carte');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur API TCGdex:', error);
    return null;
  }
};
export const getPokemonSets = async () => {
  try {
    const response = await fetch(`${BASE_URL}/sets`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des sets');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur API TCGdex (sets):', error);
    return [];
  }
};