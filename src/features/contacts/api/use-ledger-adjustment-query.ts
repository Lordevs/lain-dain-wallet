import { useQuery, onlineManager } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { useAuthStore } from '@/store/use-auth-store'
import { buildLocalWalletInput } from '@/lib/wallet-local-input'
import { computeLocalLedgerAdjustment } from '@/lib/wallet-local'

/** GET /api/expenses/with/{user_id}/adjustment/ — per currency shared
 * with this person, how much of what's owed in each direction (across
 * the direct friendship + every shared group) can be netted off without
 * money changing hands. Empty array means nothing to adjust. */
export function useLedgerAdjustmentQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['ledger-adjustment', userId],
    queryFn: async () => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!onlineManager.isOnline() && ownerId && userId) {
        const input = await buildLocalWalletInput(ownerId)
        if (input) return computeLocalLedgerAdjustment(input, userId)
      }
      const { data, error } = await apiClient.GET('/api/expenses/with/{user_id}/adjustment/', {
        params: { path: { user_id: userId! } },
      })
      if (error) throw toApiError(error)
      return data
    },
    enabled: !!userId,
    networkMode: 'always',
  })
}
