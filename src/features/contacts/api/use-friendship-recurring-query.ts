import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { onlineManager } from '@tanstack/react-query'
import { useAuthStore } from '@/store/use-auth-store'
import { getResourceSnapshot } from '@/lib/sqlite/resource-snapshot-store'

export type FriendshipRecurringExpense = components['schemas']['RecurringExpenseRead']

export function useFriendshipRecurringQuery(friendshipId: string | undefined) {
  return useQuery({
    queryKey: ['friendship-recurring', friendshipId],
    queryFn: async (): Promise<FriendshipRecurringExpense[]> => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!onlineManager.isOnline() && ownerId) {
        return getResourceSnapshot(ownerId, 'recurring', friendshipId!)
      }
      const { data, error } = await apiClient.GET('/api/expenses/friendships/{friendship_id}/recurring/', {
        params: { path: { friendship_id: friendshipId! } },
      })
      if (error) throw toApiError(error)
      return data.results
    },
    enabled: !!friendshipId,
    networkMode: 'always',
  })
}
