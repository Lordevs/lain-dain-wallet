import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { appendSettlementFields, type SettlementCoreValues } from '../lib/append-settlement-fields'

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
      const formData = new FormData()
      formData.append('amount', values.amount)
      await appendSettlementFields(formData, values)

      const { data, error } = await apiClient.POST('/api/expenses/friendships/{friendship_id}/settlements/', {
        params: { path: { friendship_id: friendshipId } },
        body: formData as unknown as components['schemas']['FriendshipSettlementCreateRequest'],
      })
      if (error) throw toApiError(error)
      return data
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
