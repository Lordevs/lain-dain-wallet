import type { components } from '@/lib/api/schema'
import type { CategoryBreakdownItem, MonthlySpendingItem } from '../types'

type BackendCategoryBreakdownItem = components['schemas']['CategoryBreakdownItem']
type MonthlyTrendItem = components['schemas']['MonthlyTrendItem']

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function toCategoryBreakdownItems(items: BackendCategoryBreakdownItem[]): CategoryBreakdownItem[] {
  return items
    .map((item) => ({
      id: item.category.id,
      label: item.category.name,
      amount: Number(item.total),
      percentage: item.percentage,
      color: item.category.color,
    }))
    .filter((item) => item.amount > 0)
}

export function toMonthlySpendingItems(items: MonthlyTrendItem[]): MonthlySpendingItem[] {
  return items.map((item) => ({
    month: MONTH_ABBR[item.month - 1] ?? '',
    amount: Number(item.total),
  }))
}
