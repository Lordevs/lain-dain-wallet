import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import { useAuthStore } from '@/store/use-auth-store'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { settlementFields, type SettlementCoreValues } from '../lib/append-settlement-fields'

export interface GroupSettlementEntry {
  user_id: string
  amount: string
}

export interface GroupSettlementFormValues extends SettlementCoreValues {
  /** One entry per member in this batch — a single-person settle-up is
   * just a one-item list. */
  entries: GroupSettlementEntry[]
}

/** POST /api/expenses/groups/{group_id}/settlements/ — a single Confirm
 * tap can pay/receive from several members at once. `entries` travels as
 * a JSON-encoded string (multipart has no native nested-array wire
 * format), same convention as ExpenseCreateSerializer's payers/splits. */
export function useCreateGroupSettlementMutation(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation<unknown, ApiError, GroupSettlementFormValues>({
    mutationFn: async (values) => {
      const result = await queueMutation<unknown>({
        resource: 'settlement',
        method: 'POST',
        path: `/api/expenses/groups/${groupId}/settlements/`,
        multipart: {
          fields: [['entries', JSON.stringify(values.entries)], ...settlementFields(values)],
          file: values.receipt ? {
            field: 'receipt', sourceUri: values.receipt, filename: 'receipt.jpg', mimeType: 'image/jpeg',
          } : undefined,
        },
        optimisticResult: undefined,
      })
      return result.data
    },
    onSuccess: (_data, values) => {
      queryClient.invalidateQueries({ queryKey: ['group-transactions', groupId] })
      queryClient.invalidateQueries({ queryKey: ['group-balance', groupId] })
      // entries names every other member this settlement batch touched —
      // scope to exactly those instead of every cached combined ledger view.
      const myId = useAuthStore.getState().userProfile?.id
      for (const entry of values.entries) {
        if (entry.user_id !== myId) {
          queryClient.invalidateQueries({ queryKey: ['user-ledgers', entry.user_id] })
        }
      }
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
