import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { onlineManager } from '@tanstack/react-query'
import { useAuthStore } from '@/store/use-auth-store'
import { getSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import type { components } from '@/lib/api/schema'

/** GET /api/ledger/groups/{id}/ — full group detail including its
 * member list, used to seed the add/edit expense forms' payer/split UI. */
export function useGroupQuery(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!onlineManager.isOnline() && ownerId) {
        const local = await getSnapshotRecord<components['schemas']['Group']>(ownerId, 'groups', groupId!)
        if (local) return local
      }
      const { data, error } = await apiClient.GET('/api/ledger/groups/{id}/', {
        params: { path: { id: groupId! } },
      })
      if (error) throw toApiError(error)
      return data
    },
    enabled: !!groupId,
    networkMode: 'always',
    // Membership/settings change occasionally, not per-render — worth
    // holding past the global 30s default.
    staleTime: 60_000,
  })
}
