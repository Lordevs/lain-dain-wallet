import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'

/** POST /api/expenses/with/{user_id}/adjustment/ — applies one currency's
 * worth of the preview from useLedgerAdjustmentQuery: creates one
 * immediately-confirmed Settlement per affected ledger, netting a
 * "you owe" ledger against an "owed to you" one instead of moving real
 * money. Plain JSON body (no file upload here, unlike a normal
 * settlement create). */
export function useApplyLedgerAdjustmentMutation(userId: string) {
  const queryClient = useQueryClient()

  return useMutation<unknown, ApiError, { currency: string }>({
    mutationFn: async ({ currency }) => {
      const { data, error } = await apiClient.POST('/api/expenses/with/{user_id}/adjustment/', {
        params: { path: { user_id: userId } },
        body: { currency },
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger-adjustment', userId] })
      queryClient.invalidateQueries({ queryKey: ['user-ledgers', userId] })
      queryClient.invalidateQueries({ queryKey: ['friendship-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['group-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['group-balance'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}
