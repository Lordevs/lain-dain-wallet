import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

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
      const { data, error } = await apiClient.GET('/api/expenses/groups/{group_id}/categories/', {
        params: { path: { group_id: groupId! } },
      })
      if (error) throw toApiError(error)
      return data
    },
    enabled: !!groupId,
    staleTime: 60_000,
  })
}
