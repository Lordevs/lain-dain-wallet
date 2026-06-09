import { SUPPORTED_CURRENCIES, type Currency } from '@/types'

/**
 * Format an amount with the given currency code.
 * e.g. formatCurrency(1500, 'PKR') → "Rs. 1,500"
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode)
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  return `${currency.symbol} ${formatted}`
}

/**
 * Get Currency object by code, falls back to PKR if not found.
 */
export function getCurrency(code: string): Currency {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code) ?? SUPPORTED_CURRENCIES[0]
}

/**
 * Format a compact amount for cards (e.g. 1500000 → "1.5M", 2500 → "2.5K")
 */
export function formatCompact(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode)
  const abs = Math.abs(amount)
  let formatted: string

  if (abs >= 1_000_000) {
    formatted = `${(abs / 1_000_000).toFixed(1)}M`
  } else if (abs >= 1_000) {
    formatted = `${(abs / 1_000).toFixed(1)}K`
  } else {
    formatted = abs.toString()
  }

  return `${currency.symbol}${formatted}`
}
