import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { settlementFields, type SettlementCoreValues } from '../lib/append-settlement-fields'

export interface FriendshipSettlementFormValues extends SettlementCoreValues {
  amount: string
}

/** POST /api/expenses/friendships/{friendship_id}/settlements/ — single
 * counterparty implied by the friendship, so just one `amount` field.
 * 'pay' stays pending until the other party confirms; 'receive' is
 * confirmed immediately (you're asserting the money already arrived). */
export function useCreateFriendshipSettlementMutation(friendshipId: string) {
  const queryClient = useQueryClient()

  return useMutation<unknown, ApiError, FriendshipSettlementFormValues>({
    mutationFn: async (values) => {
      const result = await queueMutation<unknown>({
        resource: 'settlement',
        method: 'POST',
        path: `/api/expenses/friendships/${friendshipId}/settlements/`,
        multipart: {
          fields: [['amount', values.amount], ...settlementFields(values)],
          file: values.receipt ? {
            field: 'receipt', sourceUri: values.receipt, filename: 'receipt.jpg', mimeType: 'image/jpeg',
          } : undefined,
        },
        optimisticResult: undefined,
      })
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendship-transactions', friendshipId] })
      const friendship = queryClient.getQueryData<components['schemas']['Friendship']>(['friendship', friendshipId])
      queryClient.invalidateQueries({ queryKey: friendship ? ['user-ledgers', friendship.friend.id] : ['user-ledgers'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
