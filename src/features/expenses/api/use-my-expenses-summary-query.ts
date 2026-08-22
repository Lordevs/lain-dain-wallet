import { useQuery, onlineManager } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { useAuthStore } from '@/store/use-auth-store'
import { getLocalExpenses } from '@/lib/sqlite/expenses-store'
import { getResourceSnapshot, getSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import { computeLocalSummary } from '@/lib/my-expenses-local'
import type { components } from '@/lib/api/schema'

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
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!onlineManager.isOnline() && ownerId) {
        const [allExpenses, settings, groups, profile] = await Promise.all([
          getLocalExpenses(ownerId),
          getSnapshotRecord<components['schemas']['PersonalExpenseSettings']>(ownerId, 'personal-settings', ownerId),
          getResourceSnapshot<components['schemas']['Group']>(ownerId, 'groups'),
          getSnapshotRecord<components['schemas']['User']>(ownerId, 'profile', ownerId),
        ])
        if (settings && profile?.default_currency) {
          return computeLocalSummary({
            allExpenses,
            settings,
            groupsById: new Map(groups.map((g) => [g.id, g])),
            meId: ownerId,
            viewerCurrency: profile.default_currency,
            todayIso: new Date().toISOString().slice(0, 10),
            year,
            month,
          })
        }
      }
      const query: YearMonthQuery = year && month ? { year, month } : {}
      const { data, error } = await apiClient.GET('/api/expenses/my-expenses/summary/', {
        params: { query } as never,
      })
      if (error) throw toApiError(error)
      return data
    },
    networkMode: 'always',
  })
}
