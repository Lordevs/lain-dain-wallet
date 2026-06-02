// ─── Dashboard Types ─────────────────────────────────────────────────────────

export interface LedgerTag {
  name: string
  amount: number // positive = receivable, negative = payable
}

export interface ContactLedger {
  id: string
  name: string
  initials: string
  avatarColor: string // tailwind bg color
  ledgerCount: number
  netAmount: number  // positive = owes you, negative = you owe
  tags: LedgerTag[]
  isOnline?: boolean
  type: 'person' | 'group'
}

export interface BalanceSummary {
  totalReceivable: number
  totalPayable: number
  netBalance: number
  currency: string
}
