'use client';
import { jsPDF } from "jspdf";
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  ShoppingCart, 
  Trophy, 
  Sword, 
  ShieldCheck,
  X,
  Trash2,
  UploadCloud
} from 'lucide-react'

interface CartItem {
  id: number
  name: string
  price: number
  qty: number
  image: string
}

interface CardItem {
  name: string
  image: string
  price: number | string
  type?: string
}

// ─── Résolution automatique de l'image via les APIs ──────────────────────────
const FR_TO_EN: Record<string, string> = {
  'ronflex': 'snorlax',
  'mewtwo': 'mewtwo',
  'kaiminus': 'totodile',
  'pikachu surfeur': 'pikachu',
  'dracaufeu': 'charizard',
  'magicarpe': 'magikarp',
  'leviator': 'gyarados',
  'evoli': 'eevee',
  'raichu': 'raichu',
  'bulbizarre': 'bulbasaur',
  'salameche': 'charmander',
  'carapuce': 'squirtle',
  'artikodin': 'articuno',
  'electhor': 'zapdos',
  'sulfura': 'moltres',
  'dracolosse': 'dragonite',
  // Ajoute d'autres si besoin
}

async function resolveCardImage(name: string, category: string): Promise<string> {
  const cat = category?.toLowerCase() ?? ''
  const normalized = name.toLowerCase().trim()
  const englishName = FR_TO_EN[normalized] ?? name

  if (cat.includes('pok')) {
    try {
      const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:"${encodeURIComponent(englishName)}"&pageSize=1`)
      const data = await res.json()
      if (data.data?.length > 0) return data.data[0].images.small
    } catch { /* silence */ }
  }

  if (cat.includes('yu') || cat.includes('gi')) {
    try {
      const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(englishName)}`)
      const data = await res.json()
      if (data.data?.length > 0) return data.data[0].card_images[0].image_url_small
    } catch { /* silence */ }
  }

  return '/cards/card1.jpg'
}
export default function HomePage() {
const router = useRouter()
const [userRole, setUserRole] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen]           = useState(false)
  const [isSellModalOpen, setIsSellModalOpen] = useState(false)
  const [selectedCard, setSelectedCard]       = useState<CardItem | null>(null)
  const [isLoggedIn, setIsLoggedIn]           = useState(false)
  const [isModalOpen, setIsModalOpen]         = useState(false)
  const [isDropdownOpen, setIsDropdownOpen]   = useState(false)
  const [isRegisterView, setIsRegisterView]   = useState(false)
  const [email, setEmail]                     = useState('')
  const [password, setPassword]               = useState('')
  const [showPassword, setShowPassword]       = useState(false)
  const [error, setError]                     = useState('')
  const [successMsg, setSuccessMsg]           = useState('')
  const [loading, setLoading]                 = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('TOUS')
  const [registerData, setRegisterData]       = useState({ prenom: '', nom: '', pseudo: '', email: '', password: '' })
  const [pokemonCards, setPokemonCards]       = useState<CardItem[]>([])
  const [yugiohCards, setYugiohCards]         = useState<CardItem[]>([])
  const [customCards, setCustomCards]         = useState<CardItem[]>([])
  const [invoiceGenerated, setInvoiceGenerated] = useState(false)

  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: 101, name: 'Booster Set de Base Édition 1', price: 120.00, qty: 1, image: '/cards/booster.jpg' },
    { id: 102, name: 'Dracaufeu Holo (Proxy)',        price: 45.00,  qty: 2, image: '/cards/card1.jpg'  },
  ])

  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0)

  // ── Fetch cartes APIs externes ──────────────────────────────────────────────
  useEffect(() => {
    async function fetchCards() {
      try {
        const pokeRes  = await fetch('https://api.pokemontcg.io/v2/cards?pageSize=4')
        const pokeData = await pokeRes.json()
        setPokemonCards(pokeData.data.map((c: any) => ({
          name:  c.name,
          image: c.images.small,
          price: c.cardmarket?.prices?.averageSellPrice ?? 0,
          type:  'POKÉMON',
        })))

        const yugiRes  = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?num=4&offset=0')
        const yugiData = await yugiRes.json()
        setYugiohCards(yugiData.data.map((c: any) => ({
          name:  c.name,
          image: c.card_images[0].image_url_small,
          price: parseFloat(c.card_prices[0].cardmarket_price) || 0,
          type:  'YU-GI-OH!',
        })))
      } catch (err) {
        console.error('Erreur API:', err)
      }
    }
    fetchCards()
  }, [])

  // ── Fetch cartes Supabase + résolution automatique des images manquantes ────
  useEffect(() => {
    async function fetchSupabaseCards() {
      const { data, error } = await supabase
        .from('Cards')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur chargement cartes Supabase :', error.message)
        return
      }

      if (!data) return

      // Pour chaque carte, on résout l'image si elle est absente
      const resolved = await Promise.all(
        data.map(async (card: any) => {
          let imageUrl = card.img

          // Si pas d'image → on cherche via l'API correspondante
          if (!imageUrl || imageUrl === '/cards/card1.jpg') {
            imageUrl = await resolveCardImage(card.name, card.category ?? '')

            // On met à jour Supabase pour ne pas re-chercher la prochaine fois
            if (imageUrl !== '/cards/card1.jpg') {
              await supabase
                .from('Cards')
                .update({ img: imageUrl })
                .eq('id', card.id)
            }
          }

          return {
            name:  card.name,
            image: imageUrl || '/cards/card1.jpg',
            price: parseFloat(card.price).toFixed(2),
            type:  'CUSTOM',
          } as CardItem
        })
      )

      setCustomCards(resolved)
    }
    fetchSupabaseCards()
  }, [])

  // ── Session Supabase ────────────────────────────────────────────────────────
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) setIsLoggedIn(true)
    }
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    setLoading(false)
    setError('Email ou mot de passe incorrect.')
    return
  }

  const userId = data.user?.id

  if (!userId) {
    setLoading(false)
    setError('Connexion impossible.')
    return
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  setLoading(false)

  if (profileError) {
    console.error(profileError)
    setError("Connexion réussie, mais impossible de vérifier le rôle.")
    return
  }

  setIsModalOpen(false)
  setEmail('')
  setPassword('')
  setError('')
  setIsLoggedIn(true)
  setUserRole(profile?.role ?? null)
  if (profile?.role === 'admin') {
    router.push('/admin')
  } else {
    router.push('/profil')
  }
}

  const handleRegister = async () => {
  const { prenom, nom, pseudo, email: regEmail, password: regPassword } = registerData

  // Vérification champs vides
  if (!prenom || !nom || !pseudo || !regEmail || !regPassword) {
    setError('Veuillez remplir tous les champs.')
    return
  }

  // Vérification format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(regEmail)) {
    setError('Adresse email invalide.')
    return
  }

  // Vérification longueur mot de passe
  if (regPassword.length < 6) {
    setError('Le mot de passe doit faire au moins 6 caractères.')
    return
  }

  // Blocage des caractères dangereux (anti-injection basique)
  const dangerousChars = /[<>{}$]/
  if (dangerousChars.test(prenom) || dangerousChars.test(nom) || dangerousChars.test(pseudo)) {
    setError('Caractères non autorisés détectés.')
    return
  }

  setError('')
  setLoading(true)

  const { error: signUpError } = await supabase.auth.signUp({
    email: regEmail,
    password: regPassword,
    options: { data: { prenom, nom, pseudo } }
  })

  setLoading(false)

  if (signUpError) {
    setError(signUpError.message)
  } else {
    setRegisterData({ prenom: '', nom: '', pseudo: '', email: '', password: '' })
    setIsRegisterView(false)
    setSuccessMsg('Compte créé ! Vérifie ton email pour confirmer ton inscription.')
    setTimeout(() => setSuccessMsg(''), 5000)
  }
}
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsDropdownOpen(false)
  }

  const removeFromCart = (id: number) => setCartItems(cartItems.filter(item => item.id !== id))

  const addToCart = (card: CardItem) => {
    setCartItems(prev => [...prev, {
      id:    Date.now(),
      name:  card.name,
      price: parseFloat(String(card.price)) || 0,
      qty:   1,
      image: card.image,
    }])
    setSelectedCard(null)
    setIsCartOpen(true)
  }

  const generateInvoice = () => {
    const doc       = new jsPDF()
    const pageW     = doc.internal.pageSize.getWidth()
    const now       = new Date()
    const dateStr   = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    const invoiceNb = `CK-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*9000+1000)}`

    doc.setFillColor(26, 61, 46)
    doc.rect(0, 0, pageW, 45, 'F')
    doc.setTextColor(212, 168, 92)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('♠  CARD-KINGDOM', 14, 20)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(200, 200, 180)
    doc.text('— LA TAVERNE DES COLLECTIONNEURS —', 14, 28)
    doc.setTextColor(212, 168, 92)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`FACTURE  ${invoiceNb}`, pageW - 14, 18, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(200, 200, 180)
    doc.setFontSize(9)
    doc.text(`Émise le ${dateStr}`, pageW - 14, 26, { align: 'right' })
    doc.setDrawColor(212, 168, 92)
    doc.setLineWidth(0.8)
    doc.line(14, 50, pageW - 14, 50)
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('DE :', 14, 60)
    doc.setFont('helvetica', 'normal')
    doc.text('Card-Kingdom SARL', 14, 67)
    doc.text('12 Rue de la Taverne, 75001 Paris', 14, 73)
    doc.text('contact@card-kingdom.fr', 14, 79)
    doc.setFont('helvetica', 'bold')
    doc.text('À :', pageW / 2, 60)
    doc.setFont('helvetica', 'normal')
    doc.text('Client — Commande en ligne', pageW / 2, 67)
    doc.text('France', pageW / 2, 73)
    doc.setDrawColor(220, 200, 160)
    doc.setLineWidth(0.3)
    doc.line(14, 88, pageW - 14, 88)
    doc.setFillColor(61, 41, 20)
    doc.rect(14, 92, pageW - 28, 9, 'F')
    doc.setTextColor(212, 168, 92)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('ARTICLE',       18,  98.5)
    doc.text('QTÉ',          130,  98.5, { align: 'center' })
    doc.text('PRIX UNIT.',   160,  98.5, { align: 'right' })
    doc.text('TOTAL',   pageW - 18, 98.5, { align: 'right' })
    let y = 108
    cartItems.forEach((item, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(248, 240, 225)
        doc.rect(14, y - 5, pageW - 28, 9, 'F')
      }
      doc.setTextColor(40, 40, 40)
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      const name = item.name.length > 45 ? item.name.slice(0, 42) + '…' : item.name
      doc.text(name,                         18,  y)
      doc.text(String(item.qty),            130,  y, { align: 'center' })
      doc.text(`${item.price.toFixed(2)} €`, 160,  y, { align: 'right' })
      doc.setFont('helvetica', 'bold')
      doc.text(`${(item.price * item.qty).toFixed(2)} €`, pageW - 18, y, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      y += 10
    })
    y += 4
    doc.setDrawColor(212, 168, 92)
    doc.setLineWidth(0.5)
    doc.line(pageW / 2, y, pageW - 14, y)
    y += 7
    const tva = cartTotal * 0.20
    const ht  = cartTotal - tva
    doc.setFontSize(9)
    doc.setTextColor(80, 60, 30)
    doc.text('Sous-total HT :',  pageW / 2 + 10, y)
    doc.setFont('helvetica', 'bold')
    doc.text(`${ht.toFixed(2)} €`, pageW - 18, y, { align: 'right' })
    y += 8
    doc.setFont('helvetica', 'normal')
    doc.text('TVA (20 %) :',     pageW / 2 + 10, y)
    doc.setFont('helvetica', 'bold')
    doc.text(`${tva.toFixed(2)} €`, pageW - 18, y, { align: 'right' })
    y += 8
    doc.setFillColor(26, 61, 46)
    doc.rect(pageW / 2, y - 5, pageW / 2 - 14, 11, 'F')
    doc.setTextColor(212, 168, 92)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL TTC :',       pageW / 2 + 10, y + 2)
    doc.text(`${cartTotal.toFixed(2)} €`, pageW - 18, y + 2, { align: 'right' })
    const footerY = doc.internal.pageSize.getHeight() - 20
    doc.setDrawColor(212, 168, 92)
    doc.setLineWidth(0.4)
    doc.line(14, footerY - 4, pageW - 14, footerY - 4)
    doc.setTextColor(120, 100, 70)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'italic')
    doc.text('Merci pour votre achat à la Taverne des Collectionneurs ⚔️  —  card-kingdom.fr', pageW / 2, footerY, { align: 'center' })
    doc.text(`Document généré automatiquement • ${invoiceNb}`, pageW / 2, footerY + 5, { align: 'center' })
    doc.save(`facture_${invoiceNb}.pdf`)
    setInvoiceGenerated(true)
    setTimeout(() => setInvoiceGenerated(false), 3500)
  }

  const categories = [
    { name: 'TOUS',      icon: '✨', count: '7.0k cartes' },
    { name: 'POKÉMON',   icon: '🔥', count: '4.2k cartes' },
    { name: 'YU-GI-OH!', icon: '🐉', count: '2.8k cartes' },
  ]

  return (
    <div className="relative min-h-screen">

      {selectedCard && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setSelectedCard(null)} />
          <div className="parchment rounded-lg border-2 border-[#8b6914] max-w-md w-full shadow-2xl relative z-10 overflow-hidden">
            <div className="p-4 border-b border-[#8b6914]/30 flex items-center justify-between bg-[#e8d5b0]/50">
              <h3 className="text-[#3d2914] font-bold text-lg tracking-wider font-serif truncate">{selectedCard.name}</h3>
              <button onClick={() => setSelectedCard(null)} className="p-1 rounded bg-[#e8d5b0] border border-[#8b6914]/40 hover:bg-[#d4c4a0] text-[#3d2914] transition-colors cursor-pointer ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col items-center p-4 sm:p-6 gap-4 sm:gap-6">
              <div className="w-36 h-48 sm:w-48 sm:h-64 rounded-lg overflow-hidden border-2 border-[#8b6914] shadow-xl">
                <img src={selectedCard.image} alt={selectedCard.name} className="w-full h-full object-contain bg-[#1a3d2e]" />
              </div>
              <div className="w-full space-y-3 text-center" style={{ fontFamily: 'Arial, sans-serif' }}>
                <p className="text-2xl font-black text-[#3d2914]">{selectedCard.price} €</p>
                <p className="text-sm text-[#5c4a32] italic">État : Mint • Livraison suivie incluse</p>
              </div>
              <div className="w-full flex flex-col sm:flex-row gap-3">
                <button onClick={() => addToCart(selectedCard)} className="flex-1 green-button py-3 rounded font-bold text-xs tracking-widest cursor-pointer shadow-md">
                  AJOUTER AU PANIER
                </button>
                <button onClick={() => setSelectedCard(null)} className="sm:w-auto px-4 py-3 rounded bg-transparent border-2 border-[#8b6914] text-[#3d2914] font-bold text-xs tracking-wider hover:bg-[#3d2914]/10 transition-colors cursor-pointer">
                  FERMER
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSellModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setIsSellModalOpen(false)} />
          <div className="parchment rounded-lg border-2 border-[#8b6914] max-w-2xl w-full shadow-2xl relative z-10 flex flex-col my-8">
            <div className="p-4 sm:p-5 border-b border-[#8b6914]/30 flex items-center justify-between bg-[#e8d5b0]/50 mt-2 mx-2 rounded-t">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1a3d2e] border border-[#d4a85c] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#d4a85c] font-black text-xl">⊕</span>
                </div>
                <h3 className="text-[#3d2914] font-bold text-base sm:text-xl tracking-wider font-serif uppercase">
                  SCELLER UNE NOUVELLE VENTE
                </h3>
              </div>
              <button onClick={() => setIsSellModalOpen(false)} className="p-1.5 rounded bg-[#e8d5b0] border border-[#8b6914]/40 hover:bg-[#d4c4a0] text-[#3d2914] transition-colors cursor-pointer flex-shrink-0 ml-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="p-4 sm:p-6 md:p-8 space-y-6 z-10" style={{ fontFamily: 'Arial, sans-serif' }}>
              <div>
                <label className="block text-xs font-bold text-[#3d2914] tracking-wide mb-2 uppercase font-serif">Illustration de la Relique</label>
                <div className="border-2 border-dashed border-[#8b6914]/40 bg-[#3d2914]/5 hover:bg-[#3d2914]/10 rounded-lg p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] sm:min-h-[140px]">
                  <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 text-[#8b6914] mb-3" />
                  <span className="text-sm font-bold text-[#3d2914]">Déposer ou Sélectionner l'image</span>
                  <span className="text-xs text-[#8b7355] mt-1">Format PNG, JPG (recto obligatoire)</span>
                </div>
              </div>
              <div className="pt-4 border-t border-[#8b6914]/30 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button type="submit" className="flex-1 green-button py-3.5 rounded font-semibold text-xs tracking-widest text-center cursor-pointer shadow-md">
                  PUBLIER L'ANNONCE
                </button>
                <button type="button" onClick={() => setIsSellModalOpen(false)} className="sm:w-auto px-6 py-3.5 rounded bg-transparent border-2 border-[#8b6914] text-[#3d2914] font-bold text-xs tracking-wider hover:bg-[#3d2914]/10 transition-colors cursor-pointer">
                  ANNULER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />
          <div className="parchment rounded-lg border-2 border-[#8b6914] max-w-lg w-full shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]">
            <div className="p-4 border-b border-[#8b6914]/30 flex items-center justify-between bg-[#e8d5b0]/50 mt-2 mx-2 rounded-t">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#3d2914]" />
                <h3 className="text-[#3d2914] font-bold text-base sm:text-lg tracking-wider font-serif">
                  VOTRE COFFRE ({cartItems.length} article{cartItems.length > 1 ? 's' : ''})
                </h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-1 rounded bg-[#e8d5b0] border border-[#8b6914]/40 hover:bg-[#d4c4a0] text-[#3d2914] transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-3" style={{ fontFamily: 'Arial, sans-serif' }}>
              {cartItems.length === 0 ? (
                <div className="text-center py-12 text-[#5c4a32] italic text-sm">
                  <p className="text-3xl mb-3">🪙</p>
                  <p>Votre panier est vide...</p>
                </div>
              ) : (
                <>
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#f5e6c8]/60 border border-[#d4a85c]/30">
                      <img src={item.image} alt={item.name} className="w-10 h-12 sm:w-12 sm:h-14 object-contain rounded bg-[#1a3d2e] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#3d2914] truncate">{item.name}</p>
                        <p className="text-xs text-[#8b7355]">Qté : {item.qty}</p>
                        <p className="text-sm font-black text-[#3d2914] mt-0.5">{(item.price * item.qty).toFixed(2)} €</p>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700 transition-colors flex-shrink-0 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {invoiceGenerated && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-100 border border-green-400 text-green-800 text-xs font-bold">
                      ✅ Facture téléchargée avec succès !
                    </div>
                  )}
                </>
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="p-3 sm:p-4 border-t border-[#8b6914]/30 bg-[#e8d5b0]/30 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-bold text-[#5c4a32]">Total :</span>
                  <span className="text-xl font-black text-[#3d2914]">{cartTotal.toFixed(2)} €</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={generateInvoice} className="flex-1 green-button py-3 rounded font-bold text-xs tracking-widest cursor-pointer shadow-md">
                    📄 PASSER LA COMMANDE
                  </button>
                  <button onClick={() => setIsCartOpen(false)} className="sm:w-auto px-4 py-3 rounded bg-transparent border-2 border-[#8b6914] text-[#3d2914] font-bold text-xs tracking-widest hover:bg-[#3d2914]/10 transition-colors cursor-pointer">
                    FERMER
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && !isLoggedIn && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={() => { setIsModalOpen(false); setIsRegisterView(false); setError('') }} />
          <div className="parchment rounded-lg border-2 border-[#8b6914] max-w-sm w-full shadow-2xl relative z-10 overflow-hidden max-h-[90vh] overflow-y-auto">

            {!isRegisterView && (
              <>
                <div className="p-4 border-b border-[#8b6914]/30 flex items-center justify-between bg-[#e8d5b0]/50">
                  <h3 className="text-[#3d2914] font-bold text-lg tracking-wider font-serif">CONNEXION</h3>
                  <button onClick={() => { setIsModalOpen(false); setError('') }} className="p-1 rounded bg-[#e8d5b0] border border-[#8b6914]/40 hover:bg-[#d4c4a0] text-[#3d2914] transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleLogin} className="p-5 sm:p-6 space-y-4" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {error && <p className="text-xs text-red-700 bg-red-100 border border-red-300 rounded px-3 py-2">{error}</p>}
                  {successMsg && <p className="text-xs text-green-700 bg-green-100 border border-green-300 rounded px-3 py-2">{successMsg}</p>}
                  <div>
                    <label className="block text-xs font-bold text-[#3d2914] mb-1 tracking-wide">E-MAIL</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 rounded bg-[#f5e6c8] border-2 border-[#8b6914] text-[#3d2914] text-sm focus:outline-none" placeholder="exemple@email.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#3d2914] mb-1 tracking-wide">MOT DE PASSE</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 pr-10 rounded bg-[#f5e6c8] border-2 border-[#8b6914] text-[#3d2914] text-sm focus:outline-none" placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b6914] cursor-pointer">
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full text-xs font-bold bg-[#3d2914] text-[#d4a85c] py-2.5 rounded hover:bg-[#3d2914]/90 transition-all shadow-md tracking-widest disabled:opacity-50">
                    {loading ? 'CONNEXION...' : 'SE CONNECTER'}
                  </button>
                  <p className="text-center text-xs text-[#5c4a32]">
                    Pas encore de compte ?{' '}
                    <a onClick={() => { setError(''); setIsRegisterView(true) }} className="text-[#1a3d2e] font-bold underline cursor-pointer">Créer un compte</a>
                  </p>
                </form>
              </>
            )}

            {isRegisterView && (
              <>
                <div className="p-4 border-b border-[#8b6914]/30 flex items-center justify-between bg-[#e8d5b0]/50">
                  <h3 className="text-[#3d2914] font-bold text-lg tracking-wider font-serif">INSCRIPTION</h3>
                  <button onClick={() => { setIsModalOpen(false); setIsRegisterView(false); setError('') }} className="p-1 rounded bg-[#e8d5b0] border border-[#8b6914]/40 hover:bg-[#d4c4a0] text-[#3d2914] transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-5 sm:p-6 space-y-4" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {error && <p className="text-xs text-red-700 bg-red-100 border border-red-300 rounded px-3 py-2">{error}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#3d2914] mb-1 tracking-wide">PRÉNOM</label>
                      <input type="text" value={registerData.prenom} onChange={e => setRegisterData(prev => ({ ...prev, prenom: e.target.value }))} className="w-full px-3 py-2 rounded bg-[#f5e6c8] border-2 border-[#8b6914] text-[#3d2914] text-sm focus:outline-none" placeholder="Arthur" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#3d2914] mb-1 tracking-wide">NOM</label>
                      <input type="text" value={registerData.nom} onChange={e => setRegisterData(prev => ({ ...prev, nom: e.target.value }))} className="w-full px-3 py-2 rounded bg-[#f5e6c8] border-2 border-[#8b6914] text-[#3d2914] text-sm focus:outline-none" placeholder="Leblanc" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#3d2914] mb-1 tracking-wide">PSEUDO</label>
                    <input type="text" value={registerData.pseudo} onChange={e => setRegisterData(prev => ({ ...prev, pseudo: e.target.value }))} className="w-full px-3 py-2 rounded bg-[#f5e6c8] border-2 border-[#8b6914] text-[#3d2914] text-sm focus:outline-none" placeholder="DragonSlayer42" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#3d2914] mb-1 tracking-wide">E-MAIL</label>
                    <input type="email" value={registerData.email} onChange={e => setRegisterData(prev => ({ ...prev, email: e.target.value }))} className="w-full px-3 py-2 rounded bg-[#f5e6c8] border-2 border-[#8b6914] text-[#3d2914] text-sm focus:outline-none" placeholder="exemple@email.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#3d2914] mb-1 tracking-wide">MOT DE PASSE</label>
                    <input type="password" value={registerData.password} onChange={e => setRegisterData(prev => ({ ...prev, password: e.target.value }))} className="w-full px-3 py-2 rounded bg-[#f5e6c8] border-2 border-[#8b6914] text-[#3d2914] text-sm focus:outline-none" placeholder="6 caractères minimum" />
                  </div>
                  <button onClick={handleRegister} disabled={loading} className="w-full text-xs font-bold bg-[#1a3d2e] border-2 border-[#d4a85c] text-[#d4a85c] py-2.5 rounded hover:bg-[#1a3d2e]/90 transition-all shadow-md tracking-widest cursor-pointer disabled:opacity-50">
                    {loading ? 'CRÉATION...' : 'CRÉER MON COMPTE'}
                  </button>
                  <p className="text-center text-xs text-[#5c4a32]">
                    Déjà un compte ?{' '}
                    <a onClick={() => { setError(''); setIsRegisterView(false) }} className="text-[#1a3d2e] font-bold underline cursor-pointer">Se connecter</a>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="min-h-screen wood-texture p-3 sm:p-4 md:p-8">
        <div className="max-w-7xl mx-auto">

          <header className="leather-panel leather-dark rounded-lg mb-6 relative z-40">
            <div className="stitching rounded-lg">
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <img src="/logo.png" alt="Card-Kingdom" className="h-10 sm:h-14 w-auto" />
                    <div className="hidden xs:block sm:block">
                      <h1 className="gold-text text-lg sm:text-2xl font-bold tracking-wider">CARD-KINGDOM</h1>
                      <p className="text-[#8b7355] text-[9px] sm:text-xs tracking-widest hidden sm:block">— LA TAVERNE DES COLLECTIONNEURS —</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 relative flex-shrink-0">
                    <NavButton icon={<img src="/Grimoire.png" alt="Catalogue" className="w-8 h-8 sm:w-12 sm:h-12" />} label="CATALOGUE" />
                    <div className="relative">
                      <NavButton icon={<img src="/Panier.png" alt="Panier" className="w-8 h-8 sm:w-11 sm:h-11" />} label="PANIER" onClick={() => setIsCartOpen(true)} />
                      {cartItems.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                          {cartItems.length}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <NavButton
                        icon={<img src="/Profil.png" alt="Profil" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />}
                        label={isLoggedIn ? 'MON COMPTE' : 'CONNEXION'}
                        isProfile
                        onClick={() => {
                          if (!isLoggedIn) setIsModalOpen(true)
                          else setIsDropdownOpen(!isDropdownOpen)
                        }}
                      />
                      {isLoggedIn && isDropdownOpen && (
                        <div className="absolute right-0 mt-3 w-48 parchment rounded-md border border-[#8b6914] shadow-2xl z-[100] overflow-hidden">
                          <button onClick={() => window.location.href = '/profil'} className="w-full flex items-center gap-3 px-4 py-3 text-[#3d2914] hover:bg-[#d4a85c]/20 transition-colors text-xs font-bold border-b border-[#8b6914]/20 text-left">
                            <img src="/Profil.png" alt="" className="w-8 h-8 object-contain" />
                            MON PROFIL
                          </button>
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-800 hover:bg-red-50 transition-colors text-xs font-bold text-left">
                            <img src="/porte.png" alt="" className="w-8 h-8 object-contain" />
                            DÉCONNEXION
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="relative">
                    <input type="text" placeholder="Rechercher une carte..." className="w-full px-4 py-2 rounded-md bg-[#f5e6c8] border-2 border-[#8b6914] text-[#3d2914] placeholder-[#8b7355] text-sm focus:outline-none" />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b6914]" />
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="parchment rounded-lg p-4 sm:p-6 md:p-10 shadow-2xl relative z-10">

            <section className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#3d2914] mb-4 leading-snug">
                Échangez, Vendez, et Collectionnez,<br/>
                <span className="text-[#8b6914]">Vos cartes de collection.</span>
              </h2>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6">
                <button className="green-button px-6 sm:px-8 py-3 rounded-md font-bold text-sm tracking-widest hover:scale-105 transition-transform">
                  EXPLORER LE CATALOGUE
                </button>
                <button onClick={() => { if (!isLoggedIn) { setIsModalOpen(true) } else { window.location.href = '/profil?sell=true' } }} className="gold-button px-6 sm:px-8 py-3 rounded-md font-bold text-[#3d2914] text-sm tracking-widest border border-[#8b6914]/50 hover:bg-[#d4a85c]/20 transition-colors">
                  VENDRE UNE CARTE
                </button>
              </div>
            </section>

            <section className="mb-10 sm:mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-6 h-6 text-[#8b6914]" />
                <h3 className="text-xl font-bold text-[#3d2914] tracking-widest">UNIVERS MAJEURS</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
                {categories.map(cat => (
                  <div
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`parchment-inner p-4 rounded-lg border transition-all cursor-pointer ${selectedCategory === cat.name ? 'border-[#8b6914] shadow-md' : 'border-[#d4a85c]/40 hover:border-[#8b6914]'}`}
                  >
                    <span className="text-2xl mb-1 block">{cat.icon}</span>
                    <h4 className="font-bold text-[#3d2914]">{cat.name}</h4>
                    <p className="text-[10px] text-[#8b7355]">{cat.count}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── ANNONCES COLLECTIONNEURS (Supabase) ── */}
            {selectedCategory === 'TOUS' && customCards.length > 0 && (
              <section className="mb-10 sm:mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">🃏</span>
                  <h3 className="text-xl font-bold text-[#3d2914] tracking-widest">ANNONCES DES COLLECTIONNEURS</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {customCards.map((card, i) => (
                    <div key={i} className="card-item rounded-lg overflow-hidden border border-[#d4a85c]/30">
                      <div className="relative bg-[#1a3d2e] flex items-center justify-center h-36 sm:h-48">
                        <img src={card.image} alt={card.name} className="h-full w-auto object-contain" />
                      </div>
                      <div className="p-2 sm:p-3">
                        <h4 className="font-bold text-[#3d2914] text-xs sm:text-sm truncate">{card.name}</h4>
                        <p className="font-bold text-[#3d2914] mt-1 sm:mt-2 text-sm">{card.price} €</p>
                        <button onClick={() => setSelectedCard(card)} className="w-full green-button mt-2 py-1.5 sm:py-2 rounded text-[10px] font-bold">
                          VOIR L'OFFRE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── CARTES POKÉMON ── */}
            {(selectedCategory === 'TOUS' || selectedCategory === 'POKÉMON') && (
              <section className="mb-10 sm:mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">🔥</span>
                  <h3 className="text-xl font-bold text-[#3d2914] tracking-widest">TRÉSORS POKÉMON</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {pokemonCards.map((card, i) => (
                    <div key={i} className="card-item rounded-lg overflow-hidden border border-[#d4a85c]/30">
                      <div className="relative bg-[#1a3d2e] flex items-center justify-center h-36 sm:h-48">
                        <img src={card.image} alt={card.name} className="h-full w-auto object-contain" />
                      </div>
                      <div className="p-2 sm:p-3">
                        <h4 className="font-bold text-[#3d2914] text-xs sm:text-sm truncate">{card.name}</h4>
                        <p className="font-bold text-[#3d2914] mt-1 sm:mt-2 text-sm">{card.price} €</p>
                        <button onClick={() => setSelectedCard(card)} className="w-full green-button mt-2 py-1.5 sm:py-2 rounded text-[10px] font-bold">
                          VOIR L'OFFRE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── CARTES YU-GI-OH! ── */}
            {(selectedCategory === 'TOUS' || selectedCategory === 'YU-GI-OH!') && (
              <section className="mb-10 sm:mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">🐉</span>
                  <h3 className="text-xl font-bold text-[#3d2914] tracking-widest">TRÉSORS YU-GI-OH!</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {yugiohCards.map((card, i) => (
                    <div key={i} className="card-item rounded-lg overflow-hidden border border-[#d4a85c]/30">
                      <div className="relative bg-[#1a3d2e] flex items-center justify-center h-36 sm:h-48">
                        <img src={card.image} alt={card.name} className="h-full w-auto object-contain" />
                      </div>
                      <div className="p-2 sm:p-3">
                        <h4 className="font-bold text-[#3d2914] text-xs sm:text-sm truncate">{card.name}</h4>
                        <p className="font-bold text-[#3d2914] mt-1 sm:mt-2 text-sm">{card.price} €</p>
                        <button onClick={() => setSelectedCard(card)} className="w-full green-button mt-2 py-1.5 sm:py-2 rounded text-[10px] font-bold">
                          VOIR L'OFFRE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </main>

          <footer className="mt-6 sm:mt-8 text-center py-4 text-[#f5e6c8]">
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-2">
              <div className="flex items-center gap-2 text-[#d4a85c] text-[10px] font-bold"><Sword className="w-3 h-3" /> 100% SÉCURISÉ</div>
              <div className="flex items-center gap-2 text-[#d4a85c] text-[10px] font-bold"><ShieldCheck className="w-3 h-3" /> EXPERTISE GARANTIE</div>
            </div>
            <p className="text-[#8b7355] text-[10px] tracking-widest mt-2">© 2026 CARD-KINGDOM - FORGEZ VOTRE COLLECTION</p>
          </footer>

        </div>
      </div>
    </div>
  )
}

function NavButton({
  icon, label, isProfile = false, onClick
}: {
  icon: React.ReactNode
  label: string
  isProfile?: boolean
  onClick?: () => void
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center group focus:outline-none">
      <div className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all ${isProfile ? 'bg-gradient-to-br from-[#d4a85c] to-[#8b6914] text-[#1a3d2e]' : 'text-[#d4a85c] group-hover:text-[#f5e6c8]'}`}>
        {icon}
      </div>
      <span className="text-[8px] sm:text-[9px] text-[#8b7355] font-bold mt-1 group-hover:text-[#d4a85c]">{label}</span>
    </button>
  )
}