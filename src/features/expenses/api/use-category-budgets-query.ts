import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { onlineManager } from '@tanstack/react-query'
import { useAuthStore } from '@/store/use-auth-store'
import { getSnapshotRecord, upsertSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import type { components } from '@/lib/api/schema'

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
      const ownerId = useAuthStore.getState().userProfile?.id
      const snapshotId = year && month ? `${year}-${month}` : 'current'
      if (!onlineManager.isOnline() && ownerId) {
        const local = await getSnapshotRecord<components['schemas']['CategoryBudgetsOverview']>(
          ownerId, 'category-budgets', snapshotId,
        )
        if (local) return local
      }
      const query: YearMonthQuery = year && month ? { year, month } : {}
      const { data, error } = await apiClient.GET('/api/expenses/my-expenses/category-budgets/', {
        params: { query } as never,
      })
      if (error) throw toApiError(error)
      if (ownerId) await upsertSnapshotRecord(ownerId, 'category-budgets', { id: snapshotId, data })
      return data
    },
    networkMode: 'always',
  })
}
