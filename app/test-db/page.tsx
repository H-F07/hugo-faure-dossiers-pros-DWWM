import { supabase } from "@/lib/supabase"

export default async function Page() {
  // On récupère toutes les cartes de ta table 'Cards'
  const { data: cards, error } = await supabase.from('Cards').select('*')

  if (error) {
    return <div>Erreur : {error.message}</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Ma Collection de Cartes</h1>
      <div style={{ display: 'grid', gap: '20px' }}>
        {cards?.map((card) => (
          <div key={card.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
            <h2>{card.name}</h2>
            <p>{card.description}</p>
            <p><strong>Prix :</strong> {card.price} €</p>
          </div>
        ))}
      </div>
    </div>
  )
}