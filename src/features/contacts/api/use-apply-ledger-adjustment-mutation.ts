import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

type SettlementRead = components['schemas']['SettlementRead']

/** POST /api/expenses/with/{user_id}/adjustment/ — applies one currency's
 * worth of the preview from useLedgerAdjustmentQuery: creates one
 * immediately-confirmed Settlement per affected ledger, netting a
 * "you owe" ledger against an "owed to you" one instead of moving real
 * money. Plain JSON body (no file upload here, unlike a normal
 * settlement create). */
export function useApplyLedgerAdjustmentMutation(userId: string) {
  const queryClient = useQueryClient()

  return useMutation<SettlementRead[], ApiError, { currency: string }>({
    mutationFn: async ({ currency }) => {
      const { data, error } = await apiClient.POST('/api/expenses/with/{user_id}/adjustment/', {
        params: { path: { user_id: userId } },
        body: { currency },
      })
      if (error) throw toApiError(error)
      return data
    },
    // This can touch the direct friendship AND every group shared with
    // userId at once, so a fixed id (like the update/delete-expense
    // mutations use) doesn't fit — but the created Settlements the server
    // hands back each carry the exact friendship/group they belong to, so
    // invalidation still only touches what was actually netted, not
    // every friendship/group in the whole cache.
    onSuccess: (settlements) => {
      queryClient.invalidateQueries({ queryKey: ['ledger-adjustment', userId] })
      queryClient.invalidateQueries({ queryKey: ['user-ledgers', userId] })
      for (const settlement of settlements) {
        if (settlement.friendship) {
          queryClient.invalidateQueries({ queryKey: ['friendship-transactions', settlement.friendship] })
        }
        if (settlement.group) {
          queryClient.invalidateQueries({ queryKey: ['group-transactions', settlement.group] })
          queryClient.invalidateQueries({ queryKey: ['group-balance', settlement.group] })
        }
      }
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}
