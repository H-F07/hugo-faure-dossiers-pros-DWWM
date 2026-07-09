const BASE_URL = 'https://api.tcgdex.dev/v2/fr';

export const getPokemonCard = async (id: string) => {
  try {
    const response = await fetch(`${BASE_URL}/cards/${id}`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de la carte');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur API TCGdex:', error);
    return null;
  }
};