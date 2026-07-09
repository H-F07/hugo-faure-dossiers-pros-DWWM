import type { Metadata } from 'next'
import { Cinzel, Cinzel_Decorative } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CurrencyProvider } from '@/hooks/CurrencyContext'
import './globals.css'

const cinzel = Cinzel({ 
  subsets: ["latin"],
  variable: '--font-cinzel',
  weight: ['400', '500', '600', '700']
})

const cinzelDecorative = Cinzel_Decorative({ 
  subsets: ["latin"],
  variable: '--font-cinzel-decorative',
  weight: ['400', '700']
})

export const metadata: Metadata = {
  title: 'Card-Kindom',
  description: 'Plateforme de vente et collection de cartes à collectionner',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="bg-[#2a1810]">
      <body className={`${cinzel.variable} ${cinzelDecorative.variable} font-sans antialiased`}>
        <CurrencyProvider>
          {children}
        </CurrencyProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}