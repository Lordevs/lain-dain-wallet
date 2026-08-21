import { createFileRoute } from '@tanstack/react-router'
import CategoryBreakdownScreen from '@/features/personal/category-breakdown-screen'

export interface CategoryBreakdownSearch {
  year?: number
  month?: number
}

export const Route = createFileRoute('/personal/reports/category-breakdown')({
  validateSearch: (search: Record<string, unknown>): CategoryBreakdownSearch => ({
    year: typeof search.year === 'number' ? search.year : undefined,
    month: typeof search.month === 'number' ? search.month : undefined,
  }),
  component: CategoryBreakdownScreen,
})
