"use client"

import { useState, useEffect, useRef } from 'react'
import { 
  Search, 
  ShoppingCart, 
  User, 
  Mail, 
  MapPin, 
  Calendar,
  Package,
  Megaphone,
  BookOpen,
  Heart,
  Settings,
  Shield,
  Camera,
  X,
  Trash2,
  Coins,
  PlusCircle,
  UploadCloud
} from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useCurrency } from '@/hooks/CurrencyContext'

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

export default function CardoriaPage() {
  const [activeMenu, setActiveMenu] = useState('profile')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cardImageInputRef = useRef<HTMLInputElement>(null)
  const editCardImageInputRef = useRef<HTMLInputElement>(null)

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSellOpen, setIsSellOpen] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const { currency, setCurrency, convert } = useCurrency()

  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [country, setCountry] = useState('')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [memberSince, setMemberSince] = useState('')

  const [tempUsername, setTempUsername] = useState('')
  const [tempBio, setTempBio] = useState('')
  const [tempUserEmail, setTempUserEmail] = useState('')
  const [tempCountry, setTempCountry] = useState('')

  const [newCardName, setNewCardName] = useState('')
  const [newCardEdition, setNewCardEdition] = useState('')
  const [newCardSet, setNewCardSet] = useState('')
  const [newCardPrice, setNewCardPrice] = useState('')
  const [newCardCondition, setNewCardCondition] = useState('Mint')
  const [newCardDescription, setNewCardDescription] = useState('')
  const [newCardImage, setNewCardImage] = useState<string | null>(null)
  const [newCardCategory, setNewCardCategory] = useState('Pokémon')

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editCard, setEditCard] = useState<{ id: number; name: string; edition: string; set: string; price: string; image: string; category?: string } | null>(null)
  const [editCardName, setEditCardName] = useState('')
  const [editCardEdition, setEditCardEdition] = useState('')
  const [editCardSet, setEditCardSet] = useState('')
  const [editCardPrice, setEditCardPrice] = useState('')
  const [editCardCondition, setEditCardCondition] = useState('Mint')
  const [editCardDescription, setEditCardDescription] = useState('')
  const [editCardImage, setEditCardImage] = useState<string | null>(null)

  const [cartItems, setCartItems] = useState<{ id: number; name: string; price: number; qty: number; image: string }[]>([])
  const [cards, setCards] = useState<{ id: number; name: string; edition: string; set: string; price: string; image: string; category?: string }[]>([])

  // ── Session Supabase ────────────────────────────────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setIsLoggedIn(false); return }

      setIsLoggedIn(true)
      const user = session.user
      const meta = user.user_metadata

      setUsername(meta?.pseudo || meta?.prenom || user.email?.split('@')[0] || 'Utilisateur')
      setBio(meta?.bio || '')
      setUserEmail(user.email || '')
      setCountry(meta?.country || 'France')

      const date = new Date(user.created_at)
      setMemberSince(date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }).toUpperCase())

      const savedAvatar = localStorage.getItem('ck_avatar')
      if (savedAvatar) setProfileImage(savedAvatar)
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setIsLoggedIn(false)
    })

    return () => subscription.unsubscribe()
  }, [])
  useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('sell') === 'true') {
    setIsSellOpen(true)
  }
}, [])

  // ── Chargement cartes Supabase + résolution images manquantes ───────────────
  useEffect(() => {
    const fetchCards = async () => {
      const { data, error } = await supabase.from('Cards').select('*')
      if (error) { console.error('Erreur chargement cartes :', error.message); return }

      const resolved = await Promise.all(
        data.map(async (card: any) => {
          let imageUrl = card.img

          if (!imageUrl || imageUrl === '/cards/card1.jpg') {
            imageUrl = await resolveCardImage(card.name, card.category ?? '')

            if (imageUrl !== '/cards/card1.jpg') {
              await supabase
                .from('Cards')
                .update({ img: imageUrl })
                .eq('id', card.id)
            }
          }

          return {
            id:       card.id,
            name:     card.name,
            edition:  card.edition,
            set:      card.set_name,
            price:    `${parseFloat(card.price).toFixed(2).replace('.', ',')} €`,
            image:    imageUrl || '/cards/card1.jpg',
            category: card.category,
          }
        })
      )

      setCards(prev => [...resolved, ...prev.filter(c => c.id < 0)])
    }
    fetchCards()
  }, [])

  // ── Chargement cartes depuis les APIs externes (Pokémon TCG + Yu-Gi-Oh) ────
  useEffect(() => {
    const fetchApiCards = async () => {
      try {
        const pokeRes  = await fetch('https://api.pokemontcg.io/v2/cards?pageSize=4')
        const pokeData = await pokeRes.json()
        const pokeCards = pokeData.data.map((c: any, i: number) => ({
          id:       -1000 - i,
          name:     c.name,
          edition:  '',
          set:      c.set?.name ?? '',
          price:    `${(c.cardmarket?.prices?.averageSellPrice ?? 0).toFixed(2).replace('.', ',')} €`,
          image:    c.images.small,
          category: 'Pokémon',
        }))

        const yugiRes  = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?num=4&offset=0')
        const yugiData = await yugiRes.json()
        const yugiCards = yugiData.data.map((c: any, i: number) => ({
          id:       -2000 - i,
          name:     c.name,
          edition:  '',
          set:      '',
          price:    `${(parseFloat(c.card_prices?.[0]?.cardmarket_price) || 0).toFixed(2).replace('.', ',')} €`,
          image:    c.card_images[0].image_url_small,
          category: 'YU-GI-OH!',
        }))

        setCards(prev => [...prev, ...pokeCards, ...yugiCards])
      } catch (err) {
        console.error('Erreur API externes :', err)
      }
    }
    fetchApiCards()
  }, [])

  // ── Publication d'une carte ─────────────────────────────────────────────────
  const handleSaveCard = async () => {
    let imageUrl = '/cards/card1.jpg'
    if (!newCardName.trim() || !newCardEdition.trim() || !newCardSet.trim() || !newCardPrice) {
  alert('Veuillez remplir tous les champs obligatoires.')
  return
}
if (parseFloat(newCardPrice) <= 0) {
  alert('Le prix doit être supérieur à 0.')
  return
}
if (parseFloat(newCardPrice) > 100000) {
  alert('Le prix semble invalide.')
  return
}
const dangerousChars = /[<>{}$]/
if (dangerousChars.test(newCardName) || dangerousChars.test(newCardDescription)) {
  alert('Caractères non autorisés détectés.')
  return
}

    if (newCardImage) {
      // Image uploadée manuellement → on l'envoie dans le storage
      const base64Data = newCardImage.split(',')[1]
      const byteCharacters = atob(base64Data)
      const byteArray = new Uint8Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i)
      }
      const fileName = `card_${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('cards-images')
        .upload(fileName, byteArray, { contentType: 'image/jpeg' })

      if (uploadError) { alert("Erreur upload image : " + uploadError.message); return }

      const { data: urlData } = supabase.storage.from('cards-images').getPublicUrl(fileName)
      imageUrl = urlData.publicUrl
    } else {
      // Pas d'image uploadée → résolution automatique via API
      imageUrl = await resolveCardImage(newCardName, newCardCategory)
    }

    const { error } = await supabase.from('Cards').insert([{
      name:        newCardName,
      edition:     newCardEdition,
      set_name:    newCardSet,
      price:       parseFloat(newCardPrice),
      description: newCardDescription,
      category:    newCardCategory,
      img:         imageUrl,           // ← colonne correcte
    }])

    if (error) {
      console.error("ERREUR DÉTAILLÉE :", error.message, error.details, error.hint)
      alert("Erreur : " + error.message)
    } else {
      const newCard = {
        id:       Date.now(),
        name:     newCardName,
        edition:  `${newCardEdition} (${newCardCondition})`,
        set:      newCardSet,
        price:    `${parseFloat(newCardPrice).toFixed(2).replace('.', ',')} €`,
        image:    imageUrl,
        category: newCardCategory,
      }
      setCards(prev => [newCard, ...prev])
      setIsSellOpen(false)
      setActiveMenu('listings')
      setNewCardName(''); setNewCardEdition(''); setNewCardSet('')
      setNewCardPrice(''); setNewCardCondition('Mint')
      setNewCardDescription(''); setNewCardImage(null)
      setNewCardCategory('Pokémon')
    }
  }

  const handleEditCardImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setEditCardImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const openEditModal = (card: { id: number; name: string; edition: string; set: string; price: string; image: string; category?: string }) => {
    setEditCard(card)
    setEditCardName(card.name)
    setEditCardEdition(card.edition)
    setEditCardSet(card.set)
    setEditCardPrice(card.price.replace(' €', '').replace(',', '.'))
    setEditCardImage(card.image)
    setIsEditOpen(true)
  }

  const handleUpdateCard = async () => {
    let imageUrl = editCardImage || '/cards/card1.jpg'

    if (editCardImage && editCardImage.startsWith('data:')) {
      const base64Data = editCardImage.split(',')[1]
      const byteCharacters = atob(base64Data)
      const byteArray = new Uint8Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i)
      }
      const fileName = `card_${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('cards-images')
        .upload(fileName, byteArray, { contentType: 'image/jpeg' })
      if (uploadError) { alert("Erreur upload : " + uploadError.message); return }
      const { data: urlData } = supabase.storage.from('cards-images').getPublicUrl(fileName)
      imageUrl = urlData.publicUrl
    }

    const { error } = await supabase.from('Cards').update({
      name:     editCardName,
      edition:  editCardEdition,
      set_name: editCardSet,
      price:    parseFloat(editCardPrice),
      img:      imageUrl,              // ← colonne correcte
    }).eq('id', editCard!.id)

    if (error) { alert("Erreur : " + error.message); return }

    setCards(prev => prev.map(c => c.id === editCard!.id ? {
      ...c,
      name:    editCardName,
      edition: editCardEdition,
      set:     editCardSet,
      price:   `${parseFloat(editCardPrice).toFixed(2).replace('.', ',')} €`,
      image:   imageUrl,
    } : c))
    setIsEditOpen(false)
  }

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0)
  const removeFromCart = (id: number) => setCartItems(cartItems.filter(item => item.id !== id))

  const triggerFileSelect = () => { if (isEditing) fileInputRef.current?.click() }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setProfileImage(base64String)
        localStorage.setItem('ck_avatar', base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCardImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setNewCardImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const startEditing = () => {
    setTempUsername(username); setTempBio(bio)
    setTempUserEmail(userEmail); setTempCountry(country)
    setIsEditing(true)
  }
  const cancelEditing = () => setIsEditing(false)
  const saveProfile = () => {
    setUsername(tempUsername); setBio(tempBio)
    setUserEmail(tempUserEmail); setCountry(tempCountry)
    setIsEditing(false)
  }

  const handleGlobalLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const menuItems = [
    { id: 'profile',    label: 'MON PROFIL',       icon: User      },
    { id: 'orders',     label: 'MES COMMANDES',     icon: Package   },
    { id: 'listings',   label: 'MES ANNONCES',      icon: Megaphone },
    { id: 'collection', label: 'MA COLLECTION',     icon: BookOpen  },
    { id: 'wishlist',   label: 'LISTE DE SOUHAITS', icon: Heart     },
    { id: 'settings',   label: 'PARAMÈTRES',        icon: Settings  },
  ]

  const orders = [
    { id: '#CMD-2024-0587', date: '12 mai 2024',   status: 'delivered', statusLabel: 'LIVRÉ',    total: '45,90 €'  },
    { id: '#CMD-2024-0431', date: '28 avril 2024', status: 'pending',   statusLabel: 'EN COURS', total: '120,00 €' },
    { id: '#CMD-2024-0289', date: '15 avril 2024', status: 'shipped',   statusLabel: 'EXPÉDIÉ',  total: '78,50 €'  },
  ]

  return (
    <div className="relative min-h-screen">

      {!isLoggedIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="parchment rounded-lg border-2 border-[#8b6914] p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative pointer-events-auto">
            <h2 className="text-[#3d2914] text-xl font-bold tracking-wider mb-2 font-serif">ACCÈS RESTREINT</h2>
            <p className="text-sm text-[#5c4a32] mb-6">Veuillez vous connecter pour accéder à votre profil Card-Kingdom.</p>
            <button onClick={() => window.location.href = '/'} className="w-full text-xs font-bold bg-[#3d2914] text-[#d4a85c] py-2.5 rounded hover:bg-[#3d2914]/90 transition-all shadow-md tracking-widest">
              SE CONNECTER
            </button>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="absolute inset-0" onClick={() => setIsCartOpen(false)}></div>
          <div className="parchment rounded-lg border-2 border-[#8b6914] max-w-lg w-full shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-3 sm:p-4 border-b border-[#8b6914]/30 flex items-start sm:items-center justify-between gap-3 bg-[#e8d5b0]/50 mt-2 mx-2 rounded-t">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#3d2914]" />
                <h3 className="text-[#3d2914] font-bold text-base sm:text-lg tracking-wider font-serif">VOTRE COFFRE (PANIER)</h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-1 rounded bg-[#e8d5b0] border border-[#8b6914]/40 hover:bg-[#d4c4a0] text-[#3d2914] transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3 z-10" style={{ fontFamily: 'Arial, sans-serif' }}>
              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-[#5c4a32] italic text-sm">Votre panier est vide... 🪙</div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="p-3 rounded border border-[#d4a85c]/40 flex items-center gap-3 bg-[#3d2914]/5">
                    <div className="w-12 h-16 bg-[#1a3d2e] relative rounded border border-[#8b6914]/30 flex-shrink-0 overflow-hidden flex items-center justify-center text-[10px] text-[#8b6914]">🎴</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#3d2914] text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-[#8b7355] mt-0.5">Quantité : {item.qty}</p>
                      <p className="font-bold text-[#3d2914] text-sm mt-1">{item.price.toFixed(2)} €</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-800 hover:text-red-900 bg-[#3d2914]/10 hover:bg-[#3d2914]/20 rounded border border-transparent transition-all cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="p-4 border-t border-[#8b6914]/30 bg-[#3d2914]/5 z-10" style={{ fontFamily: 'Arial, sans-serif' }}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                  <span className="text-sm font-bold text-[#5c4a32] tracking-wide">TOTAL DU COFFRE :</span>
                  <span className="text-xl font-black text-[#3d2914]">{cartTotal.toFixed(2)} €</span>
                </div>
                <div className="flex flex-col min-[420px]:flex-row gap-2">
                  <button onClick={() => alert('Passage à la caisse !')} className="flex-1 green-button py-2.5 rounded font-semibold text-xs tracking-widest text-center cursor-pointer shadow-md">PASSER LA COMMANDE</button>
                  <button onClick={() => setIsCartOpen(false)} className="px-4 py-2.5 rounded bg-transparent border-2 border-[#8b6914] text-[#3d2914] font-bold text-xs tracking-wider hover:bg-[#3d2914]/10 transition-colors cursor-pointer">CONTINUER</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="absolute inset-0" onClick={() => setIsEditOpen(false)}></div>
          <div className="parchment rounded-lg border-2 border-[#8b6914] max-w-xl w-full shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-3 sm:p-4 border-b border-[#8b6914]/30 flex items-start sm:items-center justify-between gap-3 bg-[#e8d5b0]/50 mt-2 mx-2 rounded-t">
              <h3 className="text-[#3d2914] font-bold text-base sm:text-lg tracking-wider font-serif">MODIFIER L'ANNONCE</h3>
              <button onClick={() => setIsEditOpen(false)} className="p-1 rounded bg-[#e8d5b0] border border-[#8b6914]/40 hover:bg-[#d4c4a0] text-[#3d2914] transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4" style={{ fontFamily: 'Arial, sans-serif' }}>
              <div>
                <label className="block text-xs font-bold text-[#3d2914] tracking-wide mb-1.5 uppercase">Illustration</label>
                <input type="file" ref={editCardImageInputRef} onChange={handleEditCardImageChange} accept="image/*" className="hidden" />
                <div onClick={() => editCardImageInputRef.current?.click()} className="border-2 border-dashed border-[#8b6914]/40 bg-[#3d2914]/5 hover:bg-[#3d2914]/10 rounded-lg p-4 text-center cursor-pointer flex flex-col items-center justify-center min-h-[120px]">
                  {editCardImage ? (
                    <img src={editCardImage} alt="Aperçu" className="w-20 h-28 object-cover rounded border border-[#8b6914]" />
                  ) : (
                    <><UploadCloud className="w-8 h-8 text-[#8b6914] mb-2" /><span className="text-xs font-bold text-[#3d2914]">Changer l'image</span></>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3d2914] tracking-wide mb-1 uppercase">Nom de la Carte</label>
                  <input type="text" value={editCardName} onChange={(e) => setEditCardName(e.target.value)} className="w-full px-3 py-2 rounded bg-[#f5e6c8] border border-[#8b6914] text-sm text-[#3d2914] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3d2914] tracking-wide mb-1 uppercase">Numéro / Édition</label>
                  <input type="text" value={editCardEdition} onChange={(e) => setEditCardEdition(e.target.value)} className="w-full px-3 py-2 rounded bg-[#f5e6c8] border border-[#8b6914] text-sm text-[#3d2914] focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3d2914] tracking-wide mb-1 uppercase">Extension / Set</label>
                  <input type="text" value={editCardSet} onChange={(e) => setEditCardSet(e.target.value)} className="w-full px-3 py-2 rounded bg-[#f5e6c8] border border-[#8b6914] text-sm text-[#3d2914] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3d2914] tracking-wide mb-1 uppercase">Prix (€)</label>
                  <input type="number" step="0.01" value={editCardPrice} onChange={(e) => setEditCardPrice(e.target.value)} className="w-full px-3 py-2 rounded bg-[#f5e6c8] border border-[#8b6914] text-sm text-[#3d2914] focus:outline-none" />
                </div>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button onClick={handleUpdateCard} className="flex-1 green-button py-2.5 rounded font-semibold text-xs tracking-widest cursor-pointer shadow-md">SAUVEGARDER</button>
                <button onClick={() => setIsEditOpen(false)} className="px-4 py-2.5 rounded bg-transparent border-2 border-[#8b6914] text-[#3d2914] font-bold text-xs tracking-wider hover:bg-[#3d2914]/10 transition-colors cursor-pointer">ANNULER</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSellOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="absolute inset-0" onClick={() => setIsSellOpen(false)}></div>
          <div className="parchment rounded-lg border-2 border-[#8b6914] max-w-xl w-full shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-3 sm:p-4 border-b border-[#8b6914]/30 flex items-start sm:items-center justify-between gap-3 bg-[#e8d5b0]/50 mt-2 mx-2 rounded-t">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#3d2914]" />
                <h3 className="text-[#3d2914] font-bold text-base sm:text-lg tracking-wider font-serif">SCELLER UNE NOUVELLE VENTE</h3>
              </div>
              <button onClick={() => setIsSellOpen(false)} className="p-1 rounded bg-[#e8d5b0] border border-[#8b6914]/40 hover:bg-[#d4c4a0] text-[#3d2914] transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveCard(); }} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 z-10" style={{ fontFamily: 'Arial, sans-serif' }}>
              <div>
                <label className="block text-xs font-bold text-[#3d2914] tracking-wide mb-1.5 uppercase font-serif">Illustration de la Relique</label>
                <input type="file" ref={cardImageInputRef} onChange={handleCardImageChange} accept="image/*" className="hidden" />
                <div onClick={() => cardImageInputRef.current?.click()} className="border-2 border-dashed border-[#8b6914]/40 bg-[#3d2914]/5 hover:bg-[#3d2914]/10 rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px]">
                  {newCardImage ? (
                    <div className="relative w-20 h-28 border border-[#8b6914] shadow-md rounded overflow-hidden">
                      <img src={newCardImage} alt="Aperçu carte" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-[#8b6914] mb-2" />
                      <span className="text-xs font-bold text-[#3d2914]">Déposer ou Sélectionner l'image</span>
                      <span className="text-[10px] text-[#8b7355] mt-0.5">Laisser vide pour récupération automatique</span>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3d2914] tracking-wide mb-1 uppercase font-serif">Nom de la Carte</label>
                  <input type="text" required value={newCardName} onChange={(e) => setNewCardName(e.target.value)} placeholder="Ex: Dracaufeu Holo" className="w-full px-3 py-2 rounded bg-[#f5e6c8] border border-[#8b6914] text-sm text-[#3d2914] focus:outline-none focus:border-[#d4a85c]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3d2914] tracking-wide mb-1 uppercase font-serif">Catégorie</label>
                  <select value={newCardCategory} onChange={(e) => setNewCardCategory(e.target.value)} className="w-full px-3 py-2 rounded bg-[#f5e6c8] border border-[#8b6914] text-sm text-[#3d2914] focus:outline-none focus:border-[#d4a85c] cursor-pointer font-medium">
                    <option value="Pokémon">Pokémon</option>
                    <option value="YU-GI-OH!">Yu-Gi-Oh!</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3d2914] tracking-wide mb-1 uppercase font-serif">Numéro / Édition</label>
                  <input type="text" required value={newCardEdition} onChange={(e) => setNewCardEdition(e.target.value)} placeholder="Ex: Édition 1 - 4/102" className="w-full px-3 py-2 rounded bg-[#f5e6c8] border border-[#8b6914] text-sm text-[#3d2914] focus:outline-none focus:border-[#d4a85c]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3d2914] tracking-wide mb-1 uppercase font-serif">Extension / Set</label>
                  <input type="text" required value={newCardSet} onChange={(e) => setNewCardSet(e.target.value)} placeholder="Ex: Set de Base" className="w-full px-3 py-2 rounded bg-[#f5e6c8] border border-[#8b6914] text-sm text-[#3d2914] focus:outline-none focus:border-[#d4a85c]" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3d2914] tracking-wide mb-1 uppercase font-serif">État de la carte</label>
                  <select value={newCardCondition} onChange={(e) => setNewCardCondition(e.target.value)} className="w-full px-3 py-2 rounded bg-[#f5e6c8] border border-[#8b6914] text-sm text-[#3d2914] focus:outline-none focus:border-[#d4a85c] cursor-pointer font-medium">
                    <option value="Mint">Mint (Parfait état)</option>
                    <option value="Near Mint">Near Mint (Très bon état)</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good (Joué)</option>
                    <option value="Light Played">Light Played</option>
                    <option value="Poor">Poor (Abîmé)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3d2914] tracking-wide mb-1 uppercase font-serif">Prix de départ (€)</label>
                  <div className="relative">
                    <input type="number" step="0.01" required value={newCardPrice} onChange={(e) => setNewCardPrice(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 pr-8 rounded bg-[#f5e6c8] border border-[#8b6914] text-sm text-[#3d2914] focus:outline-none focus:border-[#d4a85c]" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8b6914]">€</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3d2914] tracking-wide mb-1 uppercase font-serif">Parchemins additionnels (Description)</label>
                <textarea rows={3} value={newCardDescription} onChange={(e) => setNewCardDescription(e.target.value)} placeholder="Détails sur l'envoi, l'état précis..." className="w-full px-3 py-2 rounded bg-[#f5e6c8] border border-[#8b6914] text-sm text-[#3d2914] focus:outline-none focus:border-[#d4a85c] resize-none" />
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button type="submit" className="flex-1 green-button py-2.5 rounded font-semibold text-xs tracking-widest text-center cursor-pointer shadow-md">PUBLIER L'ANNONCE</button>
                <button type="button" onClick={() => setIsSellOpen(false)} className="px-4 py-2.5 rounded bg-transparent border-2 border-[#8b6914] text-[#3d2914] font-bold text-xs tracking-wider hover:bg-[#3d2914]/10 transition-colors cursor-pointer">ANNULER</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={`transition-all duration-300 ${!isLoggedIn ? 'blur-sm pointer-events-none select-none' : 'pointer-events-auto'}`}>
        <div className="min-h-screen wood-texture p-1.5 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div className="wood-texture rounded-lg p-2 sm:p-3 md:p-4 max-w-7xl mx-auto w-full">

            <header className="leather-panel leather-dark rounded-lg mb-3 md:mb-4 relative">
              <div className="stitching rounded-lg">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,auto)_minmax(280px,520px)_auto] items-center p-3 sm:p-4 gap-3 sm:gap-4">
                  <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3 min-w-0">
                    <img src="/logo.png" alt="Card-Kingdom" className="h-10 sm:h-12 w-auto shrink-0" />
                    <div className="min-w-0">
                      <h1 className="gold-text text-lg min-[380px]:text-xl sm:text-2xl font-bold tracking-wider whitespace-nowrap">Card-Kingdom</h1>
                      <p className="text-[#8b7355] text-[9px] min-[380px]:text-[10px] sm:text-xs tracking-widest">— CARTES DE COLLECTION —</p>
                    </div>
                  </div>
                  <div className="w-full justify-self-center">
                    <div className="relative">
                      <input type="text" placeholder="Rechercher une carte, une série..." className="w-full px-4 py-2 sm:py-2.5 pr-10 rounded-md bg-[#f5e6c8] border-2 border-[#8b6914] text-[#3d2914] placeholder-[#8b7355] text-sm focus:outline-none focus:border-[#d4a85c] shadow-inner" />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#8b6914]" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center lg:justify-end gap-2 sm:gap-4 flex-wrap w-full lg:w-auto">
                    <NavButton icon={<img src="/Maison.png" alt="Accueil" className="w-11 h-11" />} label="ACCUEIL" onClick={() => window.location.href = '/'} />
                    <NavButton icon={<img src="/Bourse.png" alt="Vendre" className="w-11 h-11" />} label="VENDRE" onClick={() => setIsSellOpen(true)} />
                    <div className="relative">
                      <NavButton icon={<img src="/Panier.png" alt="Panier" className="w-11 h-11" />} label="PANIER" onClick={() => setIsCartOpen(true)} />
                      {cartItems.length > 0 && (
                        <span className="absolute top-0 right-1 bg-red-800 text-[#d4a85c] border border-[#d4a85c] text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">{cartItems.length}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <div className="parchment rounded-lg relative">
              <div className="corner-ornament top-left"></div>
              <div className="corner-ornament top-right"></div>
              <div className="corner-ornament bottom-left"></div>
              <div className="corner-ornament bottom-right"></div>
              <div className="absolute inset-2 sm:inset-6 border border-[#d4a85c]/30 rounded pointer-events-none"></div>
              <div className="absolute inset-4 sm:inset-8 border border-[#8b6914]/20 rounded pointer-events-none"></div>

              <div className="p-3 sm:p-6 md:p-8 relative z-10">

                <div className="pb-6 mb-6 border-b border-[#8b6914]/20">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6">
                    <div className="flex flex-col items-center justify-center relative z-20">
                      <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                      <div onClick={triggerFileSelect} className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#d4a85c] to-[#8b6914] flex items-center justify-center shadow-md overflow-hidden relative border-2 border-[#8b6914] ${isEditing ? 'cursor-pointer hover:brightness-90 transition-all' : ''}`}>
                        {profileImage ? (
                          <img src={profileImage} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#1a3d2e] text-3xl sm:text-4xl font-bold">
                            {(isEditing ? tempUsername : username).charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                        {isEditing && (
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Camera className="w-5 h-5 text-white" />
                            <span className="text-[8px] text-white font-bold mt-1">CHANGER</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 green-button px-3 py-1 rounded text-[10px] font-semibold tracking-wide text-center">
                        MEMBRE DEPUIS<br />{memberSince || '...'}
                      </div>
                    </div>

                    <div className="flex-1 w-full text-center md:text-left">
                      {isEditing ? (
                        <div className="space-y-3 max-w-md mx-auto md:mx-0">
                          <div>
                            <label className="block text-[10px] font-bold text-[#3d2914] tracking-wide mb-1">PSEUDO</label>
                            <input type="text" value={tempUsername} onChange={(e) => setTempUsername(e.target.value)} style={{ fontFamily: 'Arial, sans-serif' }} className="w-full px-3 py-1.5 rounded bg-[#f5e6c8] border border-[#8b6914] text-sm text-[#3d2914] focus:outline-none focus:border-[#d4a85c]" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#3d2914] tracking-wide mb-1">BIOGRAPHIE</label>
                            <textarea value={tempBio} onChange={(e) => setTempBio(e.target.value)} style={{ fontFamily: 'Arial, sans-serif' }} rows={2} className="w-full px-3 py-1.5 rounded bg-[#f5e6c8] border border-[#8b6914] text-sm text-[#3d2914] focus:outline-none focus:border-[#d4a85c] resize-none" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-[#3d2914] tracking-wide mb-1">EMAIL</label>
                              <input type="email" value={tempUserEmail} onChange={(e) => setTempUserEmail(e.target.value)} style={{ fontFamily: 'Arial, sans-serif' }} className="w-full px-3 py-1.5 rounded bg-[#f5e6c8] border border-[#8b6914] text-sm text-[#3d2914] focus:outline-none focus:border-[#d4a85c]" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#3d2914] tracking-wide mb-1">PAYS</label>
                              <input type="text" value={tempCountry} onChange={(e) => setTempCountry(e.target.value)} style={{ fontFamily: 'Arial, sans-serif' }} className="w-full px-3 py-1.5 rounded bg-[#f5e6c8] border border-[#8b6914] text-sm text-[#3d2914] focus:outline-none focus:border-[#d4a85c]" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <h2 className="text-2xl sm:text-3xl font-bold text-[#3d2914] break-words min-w-0">{username || '...'}</h2>
                            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[#2d6a4f]" />
                          </div>
                          <p style={{ fontFamily: 'Arial, sans-serif' }} className="text-[#5c4a32] text-sm sm:text-base mb-3 sm:mb-4 italic">{bio || 'Aucune biographie renseignée.'}</p>
                          <div style={{ fontFamily: 'Arial, sans-serif' }} className="space-y-1.5 sm:space-y-2 text-[#5c4a32] text-sm">
                            <div className="flex items-center justify-center md:justify-start gap-2 min-w-0"><Mail className="w-4 h-4 text-[#8b6914] flex-shrink-0" /><span className="break-all">{userEmail}</span></div>
                            <div className="flex items-center justify-center md:justify-start gap-2"><MapPin className="w-4 h-4 text-[#8b6914]" /><span>{country}</span></div>
                            <div className="flex items-center justify-center md:justify-start gap-2"><Calendar className="w-4 h-4 text-[#8b6914]" /><span>Membre depuis {memberSince || '...'}</span></div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="md:self-center mt-4 md:mt-0 relative z-30">
                      {isEditing ? (
                        <div className="flex flex-col min-[420px]:flex-row gap-2">
                          <button onClick={saveProfile} className="green-button px-4 py-2 rounded font-semibold text-xs tracking-wide cursor-pointer">SAUVEGARDER</button>
                          <button onClick={cancelEditing} className="px-4 py-2 rounded bg-red-800 border-2 border-[#d4a85c] text-white font-semibold text-xs tracking-wide hover:bg-red-900 transition-colors cursor-pointer">ANNULER</button>
                        </div>
                      ) : (
                        <button onClick={startEditing} className="green-button px-4 sm:px-6 py-2 sm:py-2.5 rounded font-semibold text-xs sm:text-sm tracking-wide hover:opacity-90 transition-all cursor-pointer">MODIFIER LE PROFIL</button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 relative z-10">
                  <div className="lg:w-64 flex-shrink-0">
                    <div className="leather-panel leather-dark rounded-lg overflow-hidden">
                      <div className="stitching rounded-lg">
                        <nav className="p-2">
                          {menuItems.map((item) => (
                            <button key={item.id} onClick={() => { setActiveMenu(item.id); setIsEditing(false); }} className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded transition-all text-left cursor-pointer ${activeMenu === item.id ? 'bg-[#f5e6c8]/10 border-l-4 border-[#d4a85c]' : 'hover:bg-[#f5e6c8]/5 border-l-4 border-transparent'}`}>
                              <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${activeMenu === item.id ? 'text-[#d4a85c]' : 'text-[#8b7355]'}`} />
                              <span className={`text-xs sm:text-sm font-medium tracking-wide ${activeMenu === item.id ? 'text-[#d4a85c]' : 'text-[#b8a080]'}`}>{item.label}</span>
                            </button>
                          ))}
                          <button onClick={handleGlobalLogout} className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded transition-all text-left border-l-4 border-transparent hover:bg-red-950/20 text-red-400 mt-4 cursor-pointer">
                            <User className="w-4 h-4 text-red-400" />
                            <span className="text-xs sm:text-sm font-medium tracking-wide">DECONNEXION</span>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    {activeMenu === 'profile' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                          <StatCard icon="📋" value={cards.length.toString()} label="CARTES EN VENTE" />
                          <StatCard icon="🏆" value="47" label="VENTES RÉALISÉES" />
                          <StatCard icon="✓" value="98%" label="AVIS POSITIFS" />
                          <StatCard icon="★" value="4,8" suffix="/5" label="NOTE MOYENNE" />
                        </div>
                        <div>
                          <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between gap-3 mb-3 sm:mb-4">
                            <h3 className="text-base sm:text-lg font-bold text-[#3d2914] tracking-wide">MES DERNIÈRES ANNONCES</h3>
                            <button onClick={() => setActiveMenu('listings')} className="gold-button px-3 sm:px-4 py-1.5 rounded text-xs font-semibold tracking-wide cursor-pointer">VOIR TOUT</button>
                          </div>
                          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                            {cards.slice(0, 4).map((card) => <CardItemComponent key={card.id} card={card} onEdit={openEditModal} />)}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeMenu === 'orders' && (
                      <div>
                        <h3 className="text-lg font-bold text-[#3d2914] tracking-wide mb-4 font-serif">HISTORIQUE DES COMMANDES</h3>
                        <div className="overflow-hidden w-full">
                          <div className="hidden sm:grid grid-cols-5 gap-2 p-3 border-b border-[#8b6914]/40 text-xs font-bold text-[#5c4a32] tracking-wide">
                            <div>COMMANDE</div><div>DATE</div><div className="text-center">STATUT</div><div className="text-right">TOTAL</div><div></div>
                          </div>
                          {orders.map((order, index) => (
                            <div key={order.id} className={`grid grid-cols-1 sm:grid-cols-5 gap-2 p-3 items-start sm:items-center text-sm ${index !== orders.length - 1 ? 'border-b border-[#8b6914]/20' : ''}`}>
                              <div className="font-medium text-[#3d2914] text-xs sm:text-sm">{order.id}</div>
                              <div className="text-[#5c4a32] text-xs sm:text-sm">{order.date}</div>
                              <div className="text-left sm:text-center sm:col-span-1">
                                <span className={`status-badge status-${order.status}`}>{order.statusLabel}</span>
                              </div>
                              <div className="text-left sm:text-right font-semibold text-[#3d2914] text-xs sm:text-sm">{order.total}</div>
                              <div className="text-left sm:text-right"><button className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#3d2914]/5 border border-[#8b6914]/40 flex items-center justify-center hover:bg-[#3d2914]/10 transition-colors sm:ml-auto cursor-pointer"><Search className="w-3 h-3 sm:w-4 sm:h-4 text-[#5c4a32]" /></button></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeMenu === 'listings' && (
                      <div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                          <h3 className="text-lg font-bold text-[#3d2914] tracking-wide font-serif">GÉRER MES ANNONCES ({cards.length})</h3>
                          <button onClick={() => setIsSellOpen(true)} className="green-button px-4 py-2 rounded text-xs font-bold tracking-wide cursor-pointer">+ CRÉER UNE ANNONCE</button>
                        </div>
                        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                          {cards.map((card) => <CardItemComponent key={card.id} card={card} onEdit={openEditModal} />)}
                        </div>
                      </div>
                    )}

                    {activeMenu === 'collection' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-[#3d2914] tracking-wide font-serif">MON CLASSEUR DE COLLECTION</h3>
                        <div className="py-2 text-center text-[#5c4a32]" style={{ fontFamily: 'Arial, sans-serif' }}>
                          <p className="text-sm italic">Vous possédez actuellement <strong>542 cartes uniques</strong> dans votre grimoire numérique.</p>
                          <div className="w-full bg-[#3d2914]/10 h-3 rounded-full mt-3 overflow-hidden border border-[#8b6914]/20"><div className="bg-[#2d6a4f] h-full rounded-full" style={{ width: '65%' }}></div></div>
                          <span className="text-[10px] block mt-1 text-[#8b7355]">Complétion du Master Set (65%)</span>
                        </div>
                        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                          {cards.map((card) => <CardItemComponent key={card.id} card={card} onEdit={openEditModal} />)}
                        </div>
                      </div>
                    )}

                    {activeMenu === 'wishlist' && (
                      <div>
                        <h3 className="text-lg font-bold text-[#3d2914] tracking-wide mb-4 font-serif">LISTE DE SOUHAITS (WISHLIST)</h3>
                        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                          <div className="card-item rounded-lg overflow-hidden opacity-80">
                            <div className="relative aspect-[3/4] bg-[#1a3d2e] flex items-center justify-center text-4xl text-[#d4a85c]/40">⭐</div>
                            <div className="p-2 bg-[#3d2914]/5">
                              <h4 className="font-bold text-[#3d2914] text-xs sm:text-sm font-serif">Lugia Neo Genesis</h4>
                              <p className="text-[10px] text-[#8b7355]">Prix souhaité : ~250€</p>
                              <button className="w-full gold-button mt-2 py-1 rounded text-[10px] font-semibold cursor-pointer">TROUVER</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeMenu === 'settings' && (
                      <div className="space-y-4" style={{ fontFamily: 'Arial, sans-serif' }}>
                        <h3 className="text-lg font-bold text-[#3d2914] tracking-wide mb-4 font-serif uppercase">Paramètres</h3>
                        <div className="py-2 max-w-md">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Coins className="w-5 h-5 text-[#8b6914]" />
                              <div>
                                <h4 className="text-sm font-bold text-[#3d2914]">Devise d'affichage</h4>
                                <p className="text-[10px] text-[#5c4a32]">Choisissez votre monnaie impériale.</p>
                              </div>
                            </div>
                            <select value={currency} onChange={(e) => setCurrency(e.target.value as 'EUR' | 'GBP' | 'USD')} className="bg-[#f5e6c8] border border-[#8b6914] rounded px-3 py-1.5 text-xs font-bold text-[#3d2914] focus:outline-none cursor-pointer w-full sm:w-auto">
                              <option value="EUR">EUR (€)</option>
                              <option value="GBP">GBP (£)</option>
                              <option value="USD">USD ($)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NavButton({ icon, label, isProfile = false, onClick }: { icon: React.ReactNode, label: string, isProfile?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 group focus:outline-none cursor-pointer shrink-0 ${isProfile ? 'w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#d4a85c] to-[#8b6914] flex items-center justify-center shadow-md' : ''}`}>
      {isProfile ? (
        <div className="text-[#1a3d2e]">{icon}</div>
      ) : (
        <>
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-[#d4a85c] group-hover:text-[#f5e6c8] transition-colors">
            {typeof icon === 'string' ? <span className="text-xl">{icon}</span> : icon}
          </div>
          <span className="text-[8px] sm:text-[10px] text-[#8b7355] tracking-wider font-medium group-hover:text-[#d4a85c] transition-colors whitespace-nowrap">{label}</span>
        </>
      )}
    </button>
  )
}

function StatCard({ icon, value, suffix = '', label }: { icon: string, value: string, suffix?: string, label: string }) {
  return (
    <div className="rounded-lg p-3 sm:p-4 text-center border border-[#8b6914]/20 bg-[#3d2914]/5 min-w-0">
      <div className="text-xl sm:text-2xl mb-1 opacity-70">{icon}</div>
      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#3d2914]">
        {value}<span className="text-base sm:text-lg text-[#5c4a32]">{suffix}</span>
      </div>
      <div className="text-[10px] sm:text-xs text-[#5c4a32] tracking-wide font-medium mt-1 uppercase break-words">{label}</div>
    </div>
  )
}

function CardItemComponent({ card, onEdit }: { card: { id: number, name: string, edition: string, set: string, price: string, image: string }, onEdit: (card: any) => void }) {
  const { convert } = useCurrency()
  const convertCardPrice = (priceStr: string) => {
    const num = parseFloat(priceStr.replace(',', '.').replace(' €', '').replace('€', ''))
    if (isNaN(num)) return priceStr
    return convert(num)
  }
  return (
    <div className="card-item rounded-lg overflow-hidden min-w-0">
      <div className="relative aspect-[3/4] bg-[#1a3d2e]">
        {card.image.startsWith('data:') || card.image.startsWith('http') ? (
          <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
        ) : (
          <Image src={card.image} alt={card.name} fill className="object-cover" />
        )}
      </div>
      <div className="p-2 sm:p-3">
        <h4 className="font-bold text-[#3d2914] text-xs sm:text-sm truncate font-serif">{card.name}</h4>
        <p className="text-[10px] sm:text-xs text-[#5c4a32] truncate">{card.edition}</p>
        <p className="text-[10px] sm:text-xs text-[#8b7355] truncate">{card.set}</p>
        <p className="font-bold text-[#3d2914] text-sm mt-1">{convertCardPrice(card.price)}</p>
        <button onClick={() => onEdit(card)} className="w-full green-button mt-2 px-2 py-1.5 sm:py-2 rounded text-[10px] sm:text-xs font-semibold tracking-wide cursor-pointer leading-tight break-words">MODIFIER L'ANNONCE</button>
      </div>
    </div>
  )
}
