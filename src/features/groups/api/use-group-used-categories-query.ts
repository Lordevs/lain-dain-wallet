import { useQuery, onlineManager } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { useAuthStore } from '@/store/use-auth-store'
import { getLocalExpenses } from '@/lib/sqlite/expenses-store'
import type { components } from '@/lib/api/schema'

/**
 * GET /api/expenses/groups/{group_id}/categories/ — only the categories
 * this group actually has expenses in, unlike useCategoriesQuery's global
 * system+user list. Powers the group Expenses screen's category filter
 * pills so a group doesn't show tabs for categories nobody's used there.
 */
export function useGroupUsedCategoriesQuery(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-used-categories', groupId],
    queryFn: async () => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!onlineManager.isOnline() && ownerId) {
        // Same distinct-set-of-used-categories computation as the live
        // endpoint, over locally cached expenses — each expense row embeds
        // its full category. Backend orders by name (see GroupUsedCateg
        // oriesView.get_queryset); localeCompare is close enough for
        // filter pills.
        const expenses = await getLocalExpenses(ownerId, { context: 'group', groupId })
        const byId = new Map<string, components['schemas']['Category']>()
        for (const expense of expenses) byId.set(expense.category.id, expense.category)
        return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
      }
      const { data, error } = await apiClient.GET('/api/expenses/groups/{group_id}/categories/', {
        params: { path: { group_id: groupId! } },
      })
      if (error) throw toApiError(error)
      return data
    },
    enabled: !!groupId,
    staleTime: 60_000,
    networkMode: 'always',
  })
}
