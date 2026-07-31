import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

// `year`/`month` are real, functional query params (see apps/expenses/
// views.py's _parse_year_month) that drf-spectacular doesn't document.
interface YearMonthQuery {
  year?: number
  month?: number
}

/** GET /api/expenses/my-expenses/category-budgets/?year=&month= — every
 * category visible to the caller (system + own, in the user's own
 * reorder position), each with this period's spent and its limit (if
 * one's set). Backs both the "Category Budgets" screen and the "Manage
 * Categories" screen, since both need the same ordered category list. */
export function useCategoryBudgetsQuery(year?: number, month?: number) {
  return useQuery({
    queryKey: ['category-budgets', year, month],
    queryFn: async () => {
      const query: YearMonthQuery = year && month ? { year, month } : {}
      const { data, error } = await apiClient.GET('/api/expenses/my-expenses/category-budgets/', {
        params: { query } as never,
      })
      if (error) throw toApiError(error)
      return data
    },
  })
}
