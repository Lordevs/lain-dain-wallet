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

// ─── Domain Types ───────────────────────────────────────────────────────────
// Canonical shapes for the app's core entities. Every feature that reads or
// writes a contact, transaction, or balance summary should use these types
// (or the store re-exports of them) rather than declaring its own variant.

export interface LedgerTag {
  name: string
  amount: number // positive = receivable, negative = payable
}

/** A person or group ledger. `type` distinguishes the two - there is no separate "Group" type. */
export interface Contact {
  id: string
  name: string
  initials: string
  avatarColor: string // Tailwind classes, e.g. "bg-[#E8F5E9] text-[#0B683A]"
  ledgerCount: number
  netAmount: number // positive = owes you, negative = you owe
  tags: LedgerTag[]
  isOnline?: boolean
  isOnLainDain?: boolean
  phone?: string
  type: 'person' | 'group'
}

export interface TransactionRecord {
  id: string
  name: string
  subtitle: string
  amount: number
  category: string
  rightSubtitle: string
  showChevron?: boolean
  className?: string
  splitType?: 'equal' | 'unequal' | 'adjustment'
  dateValue?: string
  note?: string
}

export interface BalanceSummary {
  totalReceivable: number
  totalPayable: number
  netBalance: number
  currency: string
}