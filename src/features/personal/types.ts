// ─── Personal Expenses Types ──────────────────────────────────────────────────

export interface PersonalExpense {
  id: string
  name: string
  subtitle: string
  amount: number
  currency: string
  category: 'food' | 'fuel' | 'shopping' | 'other'
}

export interface MonthlyExpenseSummary {
  totalSpent: number
  currency: string
  differenceAmount: number
  differenceMonth: string
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

export interface ReportData {
  summary: MonthlyExpenseSummary
  categories: CategoryBreakdownItem[]
  monthlySpending: MonthlySpendingItem[]
}

