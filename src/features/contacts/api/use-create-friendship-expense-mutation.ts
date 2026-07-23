import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { buildFriendshipExpenseFormData, type FriendshipExpenseFormValues } from '../lib/build-friendship-expense-form-data'

interface CreateFriendshipExpenseVariables {
  friendshipId: string
  values: FriendshipExpenseFormValues
}

export function useCreateFriendshipExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['ExpenseCreate'], ApiError, CreateFriendshipExpenseVariables>({
    mutationFn: async ({ friendshipId, values }: CreateFriendshipExpenseVariables) => {
      const formData = await buildFriendshipExpenseFormData(values)
      const { data, error } = await apiClient.POST('/api/expenses/friendships/{friendship_id}/', {
        params: { path: { friendship_id: friendshipId } },
        body: formData as unknown as components['schemas']['ExpenseCreateRequest'],
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: (_data, { friendshipId }) => {
      // Refreshes the contact's balance/breakdown, transaction history,
      // and the dashboard's wallet totals — all of which this new
      // expense just changed.
      queryClient.invalidateQueries({ queryKey: ['friendship-transactions', friendshipId] })
      queryClient.invalidateQueries({ queryKey: ['user-ledgers'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}
