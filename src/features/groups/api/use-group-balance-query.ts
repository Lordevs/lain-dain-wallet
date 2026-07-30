import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

/** GET /api/expenses/groups/{group_id}/balance/ — "who do I pay, who pays
 * me, in this group," per member. Respects the group's Smart Settle
 * setting server-side. */
export function useGroupBalanceQuery(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-balance', groupId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/expenses/groups/{group_id}/balance/', {
        params: { path: { group_id: groupId! } },
      })
      if (error) throw toApiError(error)
      return data
    },
    enabled: !!groupId,
  })
}
