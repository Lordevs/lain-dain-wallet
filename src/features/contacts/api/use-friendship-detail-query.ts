import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

/** One direct ledger's settings/read model. */
export function useFriendshipDetailQuery(friendshipId: string | undefined) {
  return useQuery({
    queryKey: ['friendship', friendshipId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/ledger/friendships/{friendship_id}/', {
        params: { path: { friendship_id: friendshipId! } },
      })
      if (error) throw toApiError(error)
      return data
    },
    enabled: !!friendshipId,
  })
}
