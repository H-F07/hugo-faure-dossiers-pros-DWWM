const BASE_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

export const getYugiohCard = async (name: string) => {
  try {
    // L'API Yu-Gi-Oh! fonctionne souvent par recherche de nom
    const response = await fetch(`${BASE_URL}?name=${encodeURIComponent(name)}`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de la carte Yu-Gi-Oh!');
    }
    const data = await response.json();
    return data.data[0]; // Retourne la première carte trouvée
  } catch (error) {
    console.error('Erreur API Yu-Gi-Oh!:', error);
    return null;
  }
};