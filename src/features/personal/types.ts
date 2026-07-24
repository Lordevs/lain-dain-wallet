// ─── Personal Expenses Types ──────────────────────────────────────────────────

export interface MonthlyExpenseSummary {
  totalSpent: number
  currency: string
  /** null when comparison is turned off in settings, or there's no
   * previous-period data to compare against. */
  comparison: { amount: number; direction: 'up' | 'down'; previousPeriodLabel: string } | null
}

export interface CategoryBreakdownItem {
  id: string
  label: string
  amount: number
  percentage: number
  color: string
}

export interface MonthlySpendingItem {
  month: string // e.g. 'Jan'
  amount: number
}

