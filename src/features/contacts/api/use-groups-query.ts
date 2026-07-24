import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

/** Every group the caller belongs to, regardless of balance — used by
 * the "Hide Ledgers" screen, which needs the full list to choose from. */
export function useGroupsQuery() {
  return useQuery({
    queryKey: ['groups', 'list'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/ledger/groups/', {
        params: { query: { page_size: 100 } },
      })
      if (error) throw toApiError(error)
      return data.results
    },
  })
}
