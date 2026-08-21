import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { onlineManager } from '@tanstack/react-query'
import { useAuthStore } from '@/store/use-auth-store'
import { getResourceSnapshot } from '@/lib/sqlite/resource-snapshot-store'

export type RecurringExpenseRead = components['schemas']['RecurringExpenseRead']

/** GET /api/expenses/groups/{group_id}/recurring/ — lists group recurring payments */
export function useGroupRecurringQuery(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-recurring', groupId],
    queryFn: async (): Promise<RecurringExpenseRead[]> => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!onlineManager.isOnline() && ownerId) {
        return getResourceSnapshot(ownerId, 'recurring', groupId!)
      }
      const { data, error } = await apiClient.GET('/api/expenses/groups/{group_id}/recurring/', {
        params: { path: { group_id: groupId! } },
      })
      if (error) throw toApiError(error)
      return data.results
    },
    enabled: !!groupId,
    networkMode: 'always',
  })
}
