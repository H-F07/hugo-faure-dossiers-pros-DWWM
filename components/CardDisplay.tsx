"use client";

import { useEffect, useState } from 'react';
import { getPokemonCard } from '../services/pokemonService';

export default function CardDisplay() {
  const [card, setCard] = useState<any>(null);

  useEffect(() => {
  getPokemonCard('swsh3-136').then((data) => {
    console.log("Données reçues de l'API :", data); // Ajoute cette ligne !
    setCard(data);
  });
}, []);
  if (!card) return <p>Chargement de ta carte...</p>;

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
      <h2>{card.name}</h2>
      <img src={card.image} alt={card.name} style={{ width: '200px' }} />
      <p>Rareté : {card.rarity}</p>
    </div>
  );
}
