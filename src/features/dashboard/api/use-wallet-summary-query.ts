import { useQuery, onlineManager } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { useAuthStore } from '@/store/use-auth-store'
import { buildLocalWalletInput } from '@/lib/wallet-local-input'
import { computeLocalWalletSummary } from '@/lib/wallet-local'

/** GET /api/expenses/wallet/summary/ — the three summary cards, all in
 * the caller's own currency. */
export function useWalletSummaryQuery() {
  return useQuery({
    queryKey: ['wallet', 'summary'],
    queryFn: async () => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!onlineManager.isOnline() && ownerId) {
        const input = await buildLocalWalletInput(ownerId)
        if (input) return computeLocalWalletSummary(input)
      }
      const { data, error } = await apiClient.GET('/api/expenses/wallet/summary/')
      if (error) throw toApiError(error)
      return data
    },
    // Same volatility as the wallet list — overrides the global 30s
    // default so the summary cards never lag a fresh write.
    staleTime: 0,
    networkMode: 'always',
  })
}
