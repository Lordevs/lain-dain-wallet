import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { onlineManager } from '@tanstack/react-query'
import { useAuthStore } from '@/store/use-auth-store'
import { getSnapshotRecord, getResourceSnapshot, upsertSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import { getLocalExpenses } from '@/lib/sqlite/expenses-store'
import { computeLocalBudgetsOverview } from '@/lib/my-expenses-local'
import type { SnapshotCategoryBudget } from '@/lib/sync/offline-snapshot'
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
        // No cached overview for this exact period — synthesize one from
        // the offline snapshot's raw pieces (limits + visible categories +
        // local expense history), so a never-viewed period still renders
        // offline instead of dead-ending. Same assembly pattern as the
        // my-expenses hooks' fallbacks.
        const [allExpenses, settings, groups, categories, limits, profile] = await Promise.all([
          getLocalExpenses(ownerId),
          getSnapshotRecord<components['schemas']['PersonalExpenseSettings']>(ownerId, 'personal-settings', ownerId),
          getResourceSnapshot<components['schemas']['Group']>(ownerId, 'groups'),
          getResourceSnapshot<components['schemas']['Category']>(ownerId, 'categories'),
          getResourceSnapshot<SnapshotCategoryBudget>(ownerId, 'budget-limits'),
          getSnapshotRecord<components['schemas']['User']>(ownerId, 'profile', ownerId),
        ])
        if (settings && profile?.default_currency && categories.length > 0) {
          return computeLocalBudgetsOverview({
            allExpenses,
            settings,
            groupsById: new Map(groups.map((group) => [group.id, group])),
            meId: ownerId,
            viewerCurrency: profile.default_currency,
            todayIso: new Date().toISOString().slice(0, 10),
            year,
            month,
            limits: limits.map((budget) => ({ categoryId: budget.category.id, limitAmount: budget.limit_amount })),
            categories,
          })
        }
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
