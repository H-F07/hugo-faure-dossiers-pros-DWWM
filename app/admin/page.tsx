"use client"

import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, LogOut, TrendingUp, PieChart, Package, Megaphone, ShieldCheck, Crown, Flame, Star, Eye, Trash2, Ban, CheckCircle, Menu, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
const orders = [
  { id: '#CMD-2024-0587', user: 'Collector_73', card: 'Dracaufeu Holo', date: '12 mai 2024', status: 'delivered', statusLabel: 'LIVRÉ', total: '450,00 €' },
  { id: '#CMD-2024-0431', user: 'YugiMaster', card: 'Blue-Eyes White Dragon', date: '10 mai 2024', status: 'pending', statusLabel: 'EN COURS', total: '320,00 €' },
  { id: '#CMD-2024-0289', user: 'PokéHunter', card: 'Pikachu Illustrator', date: '8 mai 2024', status: 'shipped', statusLabel: 'EXPÉDIÉ', total: '5 000,00 €' },
  { id: '#CMD-2024-0201', user: 'CardLegend', card: 'Dark Magician 1st Ed.', date: '5 mai 2024', status: 'delivered', statusLabel: 'LIVRÉ', total: '150,00 €' },
  { id: '#CMD-2024-0189', user: 'Grimoire99', card: 'Lugia Neo Genesis', date: '3 mai 2024', status: 'cancelled', statusLabel: 'ANNULÉ', total: '280,00 €' },
]

const cards = [
  { id: 1, name: 'Dracaufeu Holo', type: 'Pokémon', edition: 'Édition 1 - 4/102', price: '450,00 €', status: 'active', seller: 'Collector_73' },
  { id: 2, name: 'Blue-Eyes White Dragon', type: 'Yu-Gi-Oh!', edition: 'SDK-001', price: '320,00 €', status: 'active', seller: 'YugiMaster' },
  { id: 3, name: 'Pikachu Illustrator', type: 'Pokémon', edition: 'Promo', price: '5 000,00 €', status: 'pending', seller: 'PokéHunter' },
  { id: 4, name: 'Dark Magician', type: 'Yu-Gi-Oh!', edition: 'SYE-001', price: '150,00 €', status: 'active', seller: 'CardLegend' },
  { id: 5, name: 'Lugia Neo Genesis', type: 'Pokémon', edition: '9/111', price: '280,00 €', status: 'suspended', seller: 'Grimoire99' },
]

const users = [
  { id: 1, name: 'Collector_73', email: 'collector73@email.com', joined: '5 fev. 2026', sales: 47, status: 'active', role: 'member' },
  { id: 2, name: 'YugiMaster', email: 'yugimaster@email.com', joined: '3 jan. 2019', sales: 128, status: 'active', role: 'vip' },
  { id: 3, name: 'PokéHunter', email: 'pokehunter@email.com', joined: '21 avril. 2023', sales: 12, status: 'active', role: 'member' },
  { id: 4, name: 'CardLegend', email: 'cardlegend@email.com', joined: '19 nov. 2020', sales: 312, status: 'active', role: 'vip' },
  { id: 5, name: 'Grimoire99', email: 'grimoire99@email.com', joined: '11 sept. 2021', sales: 3, status: 'banned', role: 'member' },
]

const monthlyData = [35, 52, 41, 67, 58, 73, 49, 81, 62, 88, 74, 95]
const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

export default function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [animatedStats, setAnimatedStats] = useState(false)
  const [cardList, setCardList] = useState(cards)
  const [userList, setUserList] = useState(users)
  const [tooltip, setTooltip] = useState<{ index: number; value: number } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(
  () => localStorage.getItem('isAdminLoggedIn') === 'true'
)

useEffect(() => {
  if (isAdminLoggedIn) {
    setTimeout(() => setAnimatedStats(true), 100)
  }
}, [isAdminLoggedIn])
 const handleLogout = async () => {
  localStorage.removeItem('isAdminLoggedIn')
  await supabase.auth.signOut()
  window.location.href = '/'
}

  const deleteCard = (id: number) => setCardList(cardList.filter(c => c.id !== id))
  const toggleCardStatus = (id: number) => setCardList(cardList.map(c => c.id === id ? { ...c, status: c.status === 'active' ? 'suspended' : 'active' } : c))
  const toggleUserStatus = (id: number) => setUserList(userList.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'banned' : 'active' } : u))
  const toggleUserRole = (id: number) => setUserList(userList.map(u => u.id === id ? { ...u, role: u.role === 'member' ? 'vip' : 'member' } : u))
  const deleteUser = (id: number) => setUserList(userList.filter(u => u.id !== id))

  const handleMenuClick = (id: string) => {
    setActiveMenu(id)
    setSidebarOpen(false)
  }

  const statusColor = (status: string) => {
    if (status === 'delivered' || status === 'active') return 'text-green-700 bg-green-100 border-green-300'
    if (status === 'pending') return 'text-yellow-700 bg-yellow-100 border-yellow-300'
    if (status === 'shipped') return 'text-blue-700 bg-blue-100 border-blue-300'
    if (status === 'cancelled' || status === 'suspended' || status === 'banned') return 'text-red-700 bg-red-100 border-red-300'
    return ''
  }

  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'orders', label: 'COMMANDES', icon: Package },
    { id: 'listings', label: 'ANNONCES', icon: Megaphone },
    { id: 'users', label: 'UTILISATEURS', icon: Users },
  ]

  return (
    <div className="min-h-screen wood-texture flex">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 h-screen z-30
        w-64 leather-dark p-6 flex flex-col border-r border-[#8b6914] stitching
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-10 border-b border-[#8b6914] pb-4">
            <img src="/logo.png" alt="Card-Kingdom" className="h-9 w-auto" />
            <h2 className="gold-text text-lg font-bold font-serif">CARD-KINGDOM</h2>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all text-left ${
                  activeMenu === item.id
                    ? 'bg-[#f5e6c8]/10 border-l-4 border-[#d4a85c] text-[#d4a85c]'
                    : 'border-l-4 border-transparent text-[#d4a85c]/70 hover:text-[#d4a85c] hover:bg-[#f5e6c8]/5'
                }`}
              >
                <item.icon size={16} />
                <span className="text-xs font-bold tracking-wide">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 font-bold text-xs hover:text-red-300 transition-colors px-3 py-2">
          <LogOut size={16} /> DÉCONNEXION
        </button>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar mobile */}
        <header className="lg:hidden leather-dark border-b border-[#8b6914] px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#d4a85c] hover:text-[#f5e6c8] transition-colors"
          >
            <Menu size={22} />
          </button>
          <img src="/logo.png" alt="Card-Kingdom" className="h-7 w-auto" />
          <h2 className="gold-text text-sm font-bold font-serif">CARD-KINGDOM</h2>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">

          {/* DASHBOARD */}
          {activeMenu === 'dashboard' && (
            <div className="parchment p-4 md:p-8 min-h-[85vh] shadow-2xl border-4 border-[#8b6914] rounded-lg">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#3d2914] mb-6 md:mb-8 pb-4 border-b-2 border-[#8b6914] flex items-center gap-3">
                <LayoutDashboard className="w-6 h-6 md:w-7 md:h-7 text-[#8b6914]" /> Tableau de Bord Admin
              </h1>

              {/* Stats animées */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                {[
                  { l: 'COFFRE', v: '12 450 €', icon: '💰', color: 'text-yellow-700', trend: '+12%' },
                  { l: 'CITOYENS', v: '842', icon: '👥', color: 'text-blue-700', trend: '+8%' },
                  { l: 'RELIQUES', v: '156', icon: '🃏', color: 'text-purple-700', trend: '+23%' },
                  { l: 'ACTIVITÉ', v: '98%', icon: '⚡', color: 'text-green-700', trend: '+2%' },
                  { l: 'VENTES CE MOIS', v: '47', icon: '📦', color: 'text-orange-700', trend: '+15%' },
                  { l: 'REVENU MOYEN', v: '264 €', icon: '📈', color: 'text-teal-700', trend: '+5%' },
                  { l: 'TAUX CONVERSION', v: '3,2%', icon: '🎯', color: 'text-red-700', trend: '+0,4%' },
                  { l: 'AVIS POSITIFS', v: '97%', icon: '⭐', color: 'text-yellow-600', trend: '+1%' },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="parchment-inner p-3 md:p-4 border-2 border-[#8b6914] shadow-lg rounded-lg hover:shadow-xl transition-all hover:-translate-y-1"
                    style={{
                      opacity: animatedStats ? 1 : 0,
                      transform: animatedStats ? 'translateY(0)' : 'translateY(20px)',
                      transition: `all 0.4s ease ${i * 0.07}s`
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg md:text-xl">{s.icon}</span>
                      <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">{s.trend}</span>
                    </div>
                    <p className="text-[9px] md:text-[10px] font-bold text-[#5c4a32] uppercase tracking-wide">{s.l}</p>
                    <p className={`text-lg md:text-xl font-black ${s.color} mt-1`}>{s.v}</p>
                  </div>
                ))}
              </div>

              {/* Graphiques */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="parchment-inner p-4 md:p-6 border-2 border-[#8b6914] shadow-xl rounded-lg">
                  <h3 className="font-bold text-[#3d2914] mb-4 flex items-center gap-2 font-serif text-base md:text-lg">
                    <TrendingUp className="w-5 h-5 text-[#8b6914]" /> Chiffre d'affaires annuel (En k€)
                  </h3>
                  <div className="relative h-40 md:h-48 w-full bg-[#3d2914]/5 rounded-lg border border-[#8b6914]/20 p-3 pb-6">
                    <div className="flex items-end h-full gap-1">
                      {monthlyData.map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                          {tooltip?.index === i && (
                            <div className="absolute -top-6 bg-[#3d2914] text-[#d4a85c] text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap z-10">
                              {h}k €
                            </div>
                          )}
                          <div
                            className="w-full rounded-t cursor-pointer hover:brightness-110 transition-all"
                            style={{
                              height: animatedStats ? `${h}%` : '4px',
                              minHeight: '4px',
                              background: 'linear-gradient(to top, #8b6914, #d4a85c)',
                              transition: `height 0.8s ease ${i * 0.06}s`,
                            }}
                            onMouseEnter={() => setTooltip({ index: i, value: h })}
                            onMouseLeave={() => setTooltip(null)}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="absolute bottom-1 left-3 right-3 flex gap-1">
                      {months.map((m, i) => (
                        <div key={i} className="flex-1 text-center">
                          <span className="text-[6px] md:text-[7px] text-[#8b7355] font-bold">{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="parchment-inner p-4 md:p-6 border-2 border-[#8b6914] shadow-xl rounded-lg">
                  <h3 className="font-bold text-[#3d2914] mb-4 flex items-center gap-2 font-serif text-base md:text-lg">
                    <PieChart className="w-5 h-5 text-[#8b6914]" /> Répartition des Stocks
                  </h3>
                  <div className="flex items-center justify-around h-40 md:h-48">
                    <div className="relative w-28 h-28 md:w-36 md:h-36">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3d2914" strokeWidth="3" opacity="0.1" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#d4a85c" strokeWidth="3"
                          strokeDasharray={animatedStats ? "57 43" : "0 100"}
                          style={{ transition: 'stroke-dasharray 1s ease 0.5s' }} />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#8b6914" strokeWidth="3"
                          strokeDasharray={animatedStats ? "28 72" : "0 100"}
                          strokeDashoffset="-57"
                          style={{ transition: 'stroke-dasharray 1s ease 0.7s' }} />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2d6a4f" strokeWidth="3"
                          strokeDasharray={animatedStats ? "15 85" : "0 100"}
                          strokeDashoffset="-85"
                          style={{ transition: 'stroke-dasharray 1s ease 0.9s' }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs font-black text-[#3d2914]">156</span>
                        <span className="text-[9px] text-[#8b7355]">CARTES</span>
                      </div>
                    </div>
                    <div className="space-y-3 text-xs" style={{ fontFamily: 'Arial, sans-serif' }}>
                      {[
                        { label: 'Pokémon', pct: '57%', color: 'bg-[#d4a85c]' },
                        { label: 'Yu-Gi-Oh!', pct: '28%', color: 'bg-[#8b6914]' },
                        { label: 'Autres', pct: '15%', color: 'bg-[#2d6a4f]' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-sm ${item.color}`}></div>
                          <span className="text-[#5c4a32] font-medium">{item.label}</span>
                          <span className="font-black text-[#3d2914] ml-auto">{item.pct}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dernières commandes résumé */}
              <div className="mt-6 parchment-inner p-4 md:p-6 border-2 border-[#8b6914] shadow-xl rounded-lg">
                <h3 className="font-bold text-[#3d2914] mb-4 flex items-center gap-2 font-serif text-base md:text-lg">
                  <Package className="w-5 h-5 text-[#8b6914]" /> Dernières Commandes
                </h3>
                <div className="overflow-x-auto -mx-4 md:mx-0" style={{ fontFamily: 'Arial, sans-serif' }}>
                  <div className="min-w-[500px] px-4 md:px-0 md:min-w-0">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#8b6914]/30">
                          {['ID', 'Acheteur', 'Carte', 'Date', 'Statut', 'Total'].map((h) => (
                            <th key={h} className="text-left py-2 px-3 text-[#5c4a32] font-bold uppercase text-[10px] tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 3).map((order, i) => (
                          <tr key={i} className="border-b border-[#8b6914]/10 hover:bg-[#3d2914]/5 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-[#3d2914] font-bold">{order.id}</td>
                            <td className="py-2.5 px-3 text-[#5c4a32]">{order.user}</td>
                            <td className="py-2.5 px-3 text-[#5c4a32] truncate max-w-[100px]">{order.card}</td>
                            <td className="py-2.5 px-3 text-[#8b7355]">{order.date}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusColor(order.status)}`}>{order.statusLabel}</span>
                            </td>
                            <td className="py-2.5 px-3 font-black text-[#3d2914]">{order.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <button onClick={() => setActiveMenu('orders')} className="mt-3 text-[10px] font-bold text-[#8b6914] hover:text-[#3d2914] transition-colors">
                  VOIR TOUTES LES COMMANDES →
                </button>
              </div>
            </div>
          )}

          {/* COMMANDES */}
          {activeMenu === 'orders' && (
            <div className="parchment p-4 md:p-8 min-h-[85vh] shadow-2xl border-4 border-[#8b6914] rounded-lg">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#3d2914] mb-6 md:mb-8 pb-4 border-b-2 border-[#8b6914] flex items-center gap-3">
                <Package className="w-6 h-6 md:w-7 md:h-7 text-[#8b6914]" /> Gestion des Commandes
              </h1>
              <div className="parchment-inner border-2 border-[#8b6914] rounded-lg overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[600px]">
                    <thead>
                      <tr className="bg-[#3d2914]/10 border-b border-[#8b6914]/30">
                        {['ID', 'Acheteur', 'Carte', 'Date', 'Statut', 'Total', 'Actions'].map((h) => (
                          <th key={h} className="text-left py-3 px-4 text-[#5c4a32] font-bold uppercase text-[10px] tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, i) => (
                        <tr key={i} className="border-b border-[#8b6914]/10 hover:bg-[#3d2914]/5 transition-colors">
                          <td className="py-3 px-4 font-mono text-[#3d2914] font-bold">{order.id}</td>
                          <td className="py-3 px-4 text-[#5c4a32] font-medium">{order.user}</td>
                          <td className="py-3 px-4 text-[#5c4a32]">{order.card}</td>
                          <td className="py-3 px-4 text-[#8b7355]">{order.date}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusColor(order.status)}`}>{order.statusLabel}</span>
                          </td>
                          <td className="py-3 px-4 font-black text-[#3d2914]">{order.total}</td>
                          <td className="py-3 px-4">
                            <button className="p-1.5 rounded bg-[#3d2914]/10 hover:bg-[#3d2914]/20 transition-colors">
                              <Eye className="w-3.5 h-3.5 text-[#5c4a32]" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ANNONCES */}
          {activeMenu === 'listings' && (
            <div className="parchment p-4 md:p-8 min-h-[85vh] shadow-2xl border-4 border-[#8b6914] rounded-lg">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#3d2914] mb-6 md:mb-8 pb-4 border-b-2 border-[#8b6914] flex items-center gap-3">
                <Megaphone className="w-6 h-6 md:w-7 md:h-7 text-[#8b6914]" /> Gestion des Annonces
              </h1>
              <div className="parchment-inner border-2 border-[#8b6914] rounded-lg overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[600px]">
                    <thead>
                      <tr className="bg-[#3d2914]/10 border-b border-[#8b6914]/30">
                        {['Carte', 'Type', 'Édition', 'Vendeur', 'Prix', 'Statut', 'Actions'].map((h) => (
                          <th key={h} className="text-left py-3 px-4 text-[#5c4a32] font-bold uppercase text-[10px] tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cardList.map((card, i) => (
                        <tr key={i} className="border-b border-[#8b6914]/10 hover:bg-[#3d2914]/5 transition-colors">
                          <td className="py-3 px-4 font-bold text-[#3d2914]">{card.name}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${card.type === 'Pokémon' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
                              {card.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#5c4a32]">{card.edition}</td>
                          <td className="py-3 px-4 text-[#5c4a32]">{card.seller}</td>
                          <td className="py-3 px-4 font-black text-[#3d2914]">{card.price}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusColor(card.status)}`}>
                              {card.status === 'active' ? 'ACTIVE' : card.status === 'pending' ? 'EN ATTENTE' : 'SUSPENDUE'}
                            </span>
                          </td>
                          <td className="py-3 px-4 flex items-center gap-2">
                            <button onClick={() => toggleCardStatus(card.id)} className="p-1.5 rounded bg-yellow-100 hover:bg-yellow-200 transition-colors border border-yellow-300">
                              <Ban className="w-3.5 h-3.5 text-yellow-700" />
                            </button>
                            <button onClick={() => deleteCard(card.id)} className="p-1.5 rounded bg-red-100 hover:bg-red-200 transition-colors border border-red-300">
                              <Trash2 className="w-3.5 h-3.5 text-red-700" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* UTILISATEURS */}
          {activeMenu === 'users' && (
            <div className="parchment p-4 md:p-8 min-h-[85vh] shadow-2xl border-4 border-[#8b6914] rounded-lg">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#3d2914] mb-6 md:mb-8 pb-4 border-b-2 border-[#8b6914] flex items-center gap-3">
                <Users className="w-6 h-6 md:w-7 md:h-7 text-[#8b6914]" /> Gestion des Utilisateurs
              </h1>
              <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
                {[
                  { l: 'Total Citoyens', v: userList.length, icon: '👥' },
                  { l: 'Membres VIP', v: userList.filter(u => u.role === 'vip').length, icon: '👑' },
                  { l: 'Bannis', v: userList.filter(u => u.status === 'banned').length, icon: '🚫' },
                ].map((s, i) => (
                  <div key={i} className="parchment-inner p-3 md:p-4 border-2 border-[#8b6914] rounded-lg text-center">
                    <div className="text-xl md:text-2xl mb-1">{s.icon}</div>
                    <div className="text-xl md:text-2xl font-black text-[#3d2914]">{s.v}</div>
                    <div className="text-[9px] md:text-[10px] font-bold text-[#5c4a32] uppercase">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="parchment-inner border-2 border-[#8b6914] rounded-lg overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[700px]">
                    <thead>
                      <tr className="bg-[#3d2914]/10 border-b border-[#8b6914]/30">
                        {['Utilisateur', 'Email', 'Inscrit le', 'Ventes', 'Rôle', 'Statut', 'Actions'].map((h) => (
                          <th key={h} className="text-left py-3 px-4 text-[#5c4a32] font-bold uppercase text-[10px] tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {userList.map((user, i) => (
                        <tr key={i} className="border-b border-[#8b6914]/10 hover:bg-[#3d2914]/5 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#d4a85c] to-[#8b6914] flex items-center justify-center text-[#1a3d2e] font-black text-[10px]">
                                {user.name.charAt(0)}
                              </div>
                              <span className="font-bold text-[#3d2914]">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#5c4a32]">{user.email}</td>
                          <td className="py-3 px-4 text-[#8b7355]">{user.joined}</td>
                          <td className="py-3 px-4 font-black text-[#3d2914]">{user.sales}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${user.role === 'vip' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-[#3d2914]/10 text-[#5c4a32] border border-[#8b6914]/30'}`}>
                              {user.role === 'vip' && <Star className="w-2.5 h-2.5" />}
                              {user.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusColor(user.status)}`}>
                              {user.status === 'active' ? 'ACTIF' : 'BANNI'}
                            </span>
                          </td>
                          <td className="py-3 px-4 flex items-center gap-2">
                            <button
                              onClick={() => toggleUserRole(user.id)}
                              className={`p-1.5 rounded transition-colors border ${user.role === 'member' ? 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300' : 'bg-[#3d2914]/10 hover:bg-[#3d2914]/20 border-[#8b6914]/30'}`}
                            >
                              <Crown className={`w-3.5 h-3.5 ${user.role === 'member' ? 'text-yellow-700' : 'text-[#5c4a32]'}`} />
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className={`p-1.5 rounded transition-colors border ${user.status === 'active' ? 'bg-red-100 hover:bg-red-200 border-red-300' : 'bg-green-100 hover:bg-green-200 border-green-300'}`}
                            >
                              {user.status === 'active' ? <Ban className="w-3.5 h-3.5 text-red-700" /> : <CheckCircle className="w-3.5 h-3.5 text-green-700" />}
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="p-1.5 rounded bg-red-100 hover:bg-red-200 transition-colors border border-red-300"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-700" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}