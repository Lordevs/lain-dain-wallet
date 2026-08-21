import { SUPPORTED_CURRENCIES, type Currency } from '@/types'

// Keyed by code for O(1) lookup — formatCurrency/getCurrency run on every
// amount rendered on-screen, so a linear .find() over the full currency
// list adds up fast on list-heavy screens (wallet, expense lists).
const CURRENCIES_BY_CODE = new Map<string, Currency>(SUPPORTED_CURRENCIES.map((c) => [c.code, c]))

// These options never actually vary by currency code, so one shared
// formatter instance covers every call — constructing a fresh
// Intl.NumberFormat per call/render was pure waste.
const AMOUNT_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/**
 * Format an amount with the given currency code.
 * e.g. formatCurrency(1500, 'PKR') → "Rs. 1,500"
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode)
  const isNegative = amount < 0
  const formatted = AMOUNT_FORMATTER.format(Math.abs(amount))
  // PKR symbol already ends with a period; no space needed (e.g. "Rs.1,500" not "Rs. 1,500")
  const separator = currencyCode.toUpperCase() === 'PKR' ? '' : ' '
  const sign = isNegative ? '\u2011' : ''
  return `${sign}${currency.symbol}${separator}${formatted}`
}

/** Formats an amount in PKR, e.g. formatPKR(1500) → "Rs.1,500" */
export function formatPKR(amount: number): string {
  return formatCurrency(amount, 'PKR')
}

/**
 * Get Currency object by code, falls back to PKR if not found.
 */
export function getCurrency(code: string): Currency {
  return CURRENCIES_BY_CODE.get(code) ?? SUPPORTED_CURRENCIES[0]
}

/** K/M/B/T magnitude suffix for a raw number, no currency symbol — e.g.
 * 1500000 → "1.5M", 2500 → "2.5K", 5050015564.5 → "5.05B",
 * 2_300_000_000_000 → "2.30T". Shared by formatCompact (adds a currency
 * symbol) and any plain-number axis/label that needs the same
 * abbreviation without one (e.g. a chart's y-axis ticks). */
export function formatCompactNumber(amount: number): string {
  const isNegative = amount < 0
  const abs = Math.abs(amount)
  let formatted: string

  // Two decimal places from M upward — at that scale a single decimal
  // (the K-tier convention) hides amounts that are meaningfully different
  // for a financial figure (e.g. 5.05B vs 5.09B is a ~40M gap).
  if (abs >= 1_000_000_000_000) {
    formatted = `${(abs / 1_000_000_000_000).toFixed(2)}T`
  } else if (abs >= 1_000_000_000) {
    formatted = `${(abs / 1_000_000_000).toFixed(2)}B`
  } else if (abs >= 1_000_000) {
    formatted = `${(abs / 1_000_000).toFixed(2)}M`
  } else if (abs >= 1_000) {
    formatted = `${(abs / 1_000).toFixed(1)}K`
  } else {
    formatted = abs.toString()
  }

  return `${isNegative ? '-' : ''}${formatted}`
}

/**
 * Format a compact amount for cards (e.g. 1500000 → "1.5M", 2500 → "2.5K",
 * 5050015564.5 → "5.05B")
 */
export function formatCompact(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode)
  const isNegative = amount < 0
  const compact = formatCompactNumber(Math.abs(amount))
  const sign = isNegative ? '-' : ''
  return `${sign}${currency.symbol}${compact}`
}
