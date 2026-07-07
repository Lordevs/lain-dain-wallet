// ─── Currency Types ─────────────────────────────────────────────────────────

export interface Currency {
  code: string   // e.g. "PKR", "USD", "EUR"
  symbol: string // e.g. "Rs.", "$", "€"
  name: string   // e.g. "Pakistani Rupee"
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'AFN', symbol: '؀', name: 'Afghan Afghani' },
  { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat' },
  { code: 'BHD', symbol: 'د.ب', name: 'Bahraini Dinar' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'IRR', symbol: '﷼', name: 'Iranian Rial' },
  { code: 'IQD', symbol: 'ع.د', name: 'Iraqi Dinar' },
  { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'MVR', symbol: 'Rf', name: 'Maldivian Rufiyaa' },
  { code: 'MUR', symbol: '₨', name: 'Mauritian Rupee' },
  { code: 'NPR', symbol: '₨', name: 'Nepalese Rupee' },
  { code: 'OMR', symbol: '﷼', name: 'Omani Rial' },
  { code: 'PKR', symbol: 'Rs.', name: 'Pakistani Rupee' },
  { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'LKR', symbol: '₨', name: 'Sri Lankan Rupee' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
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
  avatarColor: string // Tailwind classes, e.g. "bg-[#E8F5E9] text-positive"
  avatar?: string | null
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