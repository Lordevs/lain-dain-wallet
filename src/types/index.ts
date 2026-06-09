// ─── Currency Types ─────────────────────────────────────────────────────────

export interface Currency {
  code: string   // e.g. "PKR", "USD", "EUR"
  symbol: string // e.g. "Rs.", "$", "€"
  name: string   // e.g. "Pakistani Rupee"
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'PKR', symbol: 'Rs.', name: 'Pakistani Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
]