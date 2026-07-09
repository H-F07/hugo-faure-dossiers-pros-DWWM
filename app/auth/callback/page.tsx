'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // Supabase lit automatiquement le token dans l'URL (#access_token=...)
    // et établit la session. On écoute le changement d'état.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Redirige vers la page d'accueil (ou /profil si tu préfères)
        router.replace('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-[#3d2914] font-bold tracking-widest">
        ✅ Confirmation en cours...
      </p>
    </div>
  )
}