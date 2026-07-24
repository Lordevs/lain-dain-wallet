import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

// `year`/`month` are real, functional query params (see apps/expenses/
// views.py's _parse_year_month) that drf-spectacular doesn't document,
// so the generated type doesn't know about them.
interface YearMonthQuery {
  year?: number
  month?: number
}

/** year/month select which period's summary + category breakdown to
 * report — the 12-month trend always covers that period's own calendar
 * year (see backend's MyExpensesReportView), not necessarily `year`. */
export function useMyExpensesReportQuery(year?: number, month?: number) {
  return useQuery({
    queryKey: ['my-expenses-report', year, month],
    queryFn: async () => {
      const query: YearMonthQuery = year && month ? { year, month } : {}
      const { data, error } = await apiClient.GET('/api/expenses/my-expenses/reports/', {
        params: { query: query as Record<string, never> },
      })
      if (error) throw toApiError(error)
      return data
    },
  })
}
