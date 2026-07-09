"use client"

import { createContext, useContext, useState, useEffect } from 'react'

type Currency = 'EUR' | 'GBP' | 'USD'

const rates: Record<Currency, number> = {
  EUR: 1,
  GBP: 0.85,
  USD: 1.08,
}

const symbols: Record<Currency, string> = {
  EUR: '€',
  GBP: '£',
  USD: '$',
}

type CurrencyContextType = {
  currency: Currency
  setCurrency: (c: Currency) => void
  convert: (euroAmount: number) => string
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'EUR',
  setCurrency: () => {},
  convert: (n) => `${n.toFixed(2)} €`,
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('EUR')

  useEffect(() => {
    const saved = localStorage.getItem('ck_currency') as Currency
    if (saved) setCurrencyState(saved)
  }, [])

  const setCurrency = (c: Currency) => {
    setCurrencyState(c)
    localStorage.setItem('ck_currency', c)
  }

  const convert = (euroAmount: number) => {
    const converted = euroAmount * rates[currency]
    return `${converted.toFixed(2)} ${symbols[currency]}`
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)