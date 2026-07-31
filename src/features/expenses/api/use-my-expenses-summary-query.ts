import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

// `year`/`month` are real, functional query params (see apps/expenses/
// views.py's _parse_year_month) that drf-spectacular doesn't document,
// so the generated type doesn't know about them — same situation as
// use-contacts-query.ts's search/on_lain_dain cast.
interface YearMonthQuery {
  year?: number
  month?: number
}

/** year/month select a custom period (see backend's _period_bounds) —
 * omit both for the period containing today. */
export function useMyExpensesSummaryQuery(year?: number, month?: number) {
  return useQuery({
    queryKey: ['my-expenses-summary', year, month],
    queryFn: async () => {
      const query: YearMonthQuery = year && month ? { year, month } : {}
      const { data, error } = await apiClient.GET('/api/expenses/my-expenses/summary/', {
        params: { query } as never,
      })
      if (error) throw toApiError(error)
      return data
    },
  })
}
