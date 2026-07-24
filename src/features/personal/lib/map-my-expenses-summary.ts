import type { components } from '@/lib/api/schema'
import type { MonthlyExpenseSummary } from '../types'
import { periodLabel } from './period'

type MyExpensesSummary = components['schemas']['MyExpensesSummary']

/** The previous calendar period's label (e.g. "June 2026"), derived from
 * this period's own start date — used only for the comparison badge's
 * copy, not for querying (the backend already picked which period to
 * compare against). */
function previousPeriodLabel(periodStart: string): string {
  const [year, month] = periodStart.split('-').map(Number)
  const prevDate = new Date(year, month - 2, 1) // month is 1-indexed; -2 = previous month, 0-indexed
  return periodLabel({ year: prevDate.getFullYear(), month: prevDate.getMonth() + 1 })
}

/** Maps the backend's My Expenses summary shape (spent/previous_spent/
 * comparison_enabled) into the card's own {totalSpent, comparison} shape —
 * a zero-difference or disabled/missing comparison renders no badge at all. */
export function toExpenseSummary(data: MyExpensesSummary): MonthlyExpenseSummary {
  const spent = Number(data.spent)
  const previous = data.comparison_enabled && data.previous_spent !== null ? Number(data.previous_spent) : null

  let comparison: MonthlyExpenseSummary['comparison'] = null
  if (previous !== null && previous !== spent) {
    comparison = {
      amount: Math.abs(spent - previous),
      direction: spent > previous ? 'up' : 'down',
      previousPeriodLabel: previousPeriodLabel(data.period_start),
    }
  }

  return { totalSpent: spent, currency: data.currency, comparison }
}
