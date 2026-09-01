import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { onlineManager } from '@tanstack/react-query'
import { useAuthStore } from '@/store/use-auth-store'
import { getSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import { isLocalDatabaseAvailable } from '@/lib/sqlite/init'
import type { components } from '@/lib/api/schema'

/** One direct ledger's settings/read model. */
export function useFriendshipDetailQuery(friendshipId: string | undefined) {
  return useQuery({
    queryKey: ['friendship', friendshipId],
    queryFn: async () => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!onlineManager.isOnline() && isLocalDatabaseAvailable() && ownerId) {
        const local = await getSnapshotRecord<components['schemas']['Friendship']>(
          ownerId, 'friendships', friendshipId!,
        )
        if (local) return local
      }
      const { data, error } = await apiClient.GET('/api/ledger/friendships/{friendship_id}/', {
        params: { path: { friendship_id: friendshipId! } },
      })
      if (error) throw toApiError(error)
      return data
    },
    enabled: !!friendshipId,
    networkMode: 'always',
  })
}
