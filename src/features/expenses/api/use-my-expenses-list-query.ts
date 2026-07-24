import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

// `year`/`month` are real, functional query params (see apps/expenses/
// views.py's _parse_year_month) that drf-spectacular doesn't document,
// so the generated type doesn't know about them.
interface MyExpensesListQuery {
  year?: number
  month?: number
  page_size?: number
}

/** The combined "My Expenses" feed for one period — personal expenses
 * plus any friendship/group expense the caller has a split in. Not
 * paginated client-side (matches the screen's own flat-list UI); a
 * single generous page covers everything a period reasonably holds. */
export function useMyExpensesListQuery(year?: number, month?: number) {
  return useQuery({
    queryKey: ['my-expenses-list', year, month],
    queryFn: async () => {
      const query: MyExpensesListQuery = { page_size: 100, ...(year && month ? { year, month } : {}) }
      const { data, error } = await apiClient.GET('/api/expenses/my-expenses/', {
        params: { query: query as Record<string, never> },
      })
      if (error) throw toApiError(error)
      return data.results
    },
  })
}
