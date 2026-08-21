import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { onlineManager } from '@tanstack/react-query'
import { useAuthStore } from '@/store/use-auth-store'
import { getSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import type { components } from '@/lib/api/schema'

/** GET /api/expenses/settlements/{id}/ — visible to either payer or payee,
 * regardless of who's allowed to actually act on it (see confirm/dispute/
 * cancel mutations for the narrower per-action checks). */
export function useSettlementQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['settlement', id],
    queryFn: async () => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!onlineManager.isOnline() && ownerId) {
        const local = await getSnapshotRecord<components['schemas']['SettlementRead']>(ownerId, 'settlements', id!)
        if (local) return local
      }
      const { data, error } = await apiClient.GET('/api/expenses/settlements/{id}/', {
        params: { path: { id: id! } },
      })
      if (error) throw toApiError(error)
      return data
    },
    enabled: !!id,
    networkMode: 'always',
  })
}
