import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

/** Every friendship (1:1 ledger) the caller has, regardless of balance —
 * used by the "Hide Ledgers" screen, which needs the full list to choose
 * from, not just the ones with a nonzero balance (see useWalletListQuery
 * for that narrower view). */
export function useFriendshipsQuery() {
  return useQuery({
    queryKey: ['friendships', 'list'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/ledger/friendships/', {
        params: { query: { page_size: 100 } },
      })
      if (error) throw toApiError(error)
      return data.results
    },
  })
}
