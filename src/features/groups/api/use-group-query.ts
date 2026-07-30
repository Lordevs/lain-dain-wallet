import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

/** GET /api/ledger/groups/{id}/ — full group detail including its
 * member list, used to seed the add/edit expense forms' payer/split UI. */
export function useGroupQuery(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/ledger/groups/{id}/', {
        params: { path: { id: groupId! } },
      })
      if (error) throw toApiError(error)
      return data
    },
    enabled: !!groupId,
  })
}
