import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

/** Direct 1:1 balance only; shared-group balances are deliberately excluded. */
export function useFriendshipBalanceQuery(friendshipId: string | undefined) {
  return useQuery({
    queryKey: ['friendship-balance', friendshipId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/expenses/friendships/{friendship_id}/balance/', {
        params: { path: { friendship_id: friendshipId! } },
      })
      if (error) throw toApiError(error)
      return data
    },
    enabled: !!friendshipId,
  })
}
