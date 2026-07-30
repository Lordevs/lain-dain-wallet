import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

type SettlementRead = components['schemas']['SettlementRead']

function invalidateForSettlement(queryClient: ReturnType<typeof useQueryClient>, settlement: SettlementRead) {
  queryClient.invalidateQueries({ queryKey: ['settlement', settlement.id] })
  if (settlement.friendship) {
    queryClient.invalidateQueries({ queryKey: ['friendship-transactions', settlement.friendship] })
  }
  if (settlement.group) {
    queryClient.invalidateQueries({ queryKey: ['group-transactions', settlement.group] })
    queryClient.invalidateQueries({ queryKey: ['group-balance', settlement.group] })
  }
  queryClient.invalidateQueries({ queryKey: ['user-ledgers'] })
  queryClient.invalidateQueries({ queryKey: ['wallet'] })
}

/** POST /api/expenses/settlements/{id}/confirm/ — only the party who
 * isn't recorded_by can confirm a pending settlement; applies the ledger
 * update immediately on success. */
export function useConfirmSettlementMutation() {
  const queryClient = useQueryClient()
  return useMutation<SettlementRead, ApiError, string>({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST('/api/expenses/settlements/{id}/confirm/', {
        params: { path: { id } },
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: (data) => invalidateForSettlement(queryClient, data),
  })
}

/** POST /api/expenses/settlements/{id}/dispute/ — either non-recording
 * party can dispute; if the settlement had already touched the ledger
 * (confirmed pay-mode, or auto-confirmed receive-mode), a reversal entry
 * is posted server-side. Terminal — no un-dispute path. */
export function useDisputeSettlementMutation() {
  const queryClient = useQueryClient()
  return useMutation<SettlementRead, ApiError, string>({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST('/api/expenses/settlements/{id}/dispute/', {
        params: { path: { id } },
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: (data) => invalidateForSettlement(queryClient, data),
  })
}

/** POST /api/expenses/settlements/{id}/cancel/ — only recorded_by, only
 * while pending (never touched the ledger yet, so this is a hard delete
 * server-side, no reversal needed). 204 No Content. */
export function useCancelSettlementMutation() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, { id: string; friendshipId?: string | null; groupId?: string | null }>({
    mutationFn: async ({ id }) => {
      const { error } = await apiClient.POST('/api/expenses/settlements/{id}/cancel/', {
        params: { path: { id } },
      })
      if (error) throw toApiError(error)
    },
    onSuccess: (_data, { id, friendshipId, groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['settlement', id] })
      if (friendshipId) queryClient.invalidateQueries({ queryKey: ['friendship-transactions', friendshipId] })
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ['group-transactions', groupId] })
        queryClient.invalidateQueries({ queryKey: ['group-balance', groupId] })
      }
      queryClient.invalidateQueries({ queryKey: ['user-ledgers'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}
