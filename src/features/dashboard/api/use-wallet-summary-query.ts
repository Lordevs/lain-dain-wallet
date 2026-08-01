import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

/** GET /api/expenses/wallet/summary/ — the three summary cards, all in
 * the caller's own currency. */
export function useWalletSummaryQuery() {
  return useQuery({
    queryKey: ['wallet', 'summary'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/expenses/wallet/summary/')
      if (error) throw toApiError(error)
      return data
    },
    // Same volatility as the wallet list — overrides the global 30s
    // default so the summary cards never lag a fresh write.
    staleTime: 0,
  })
}
