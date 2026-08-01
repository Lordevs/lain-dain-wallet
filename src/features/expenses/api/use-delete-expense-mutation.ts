import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'

interface DeleteExpenseVariables {
  id: string
  // Same rationale as useUpdateExpenseMutation: the caller already has
  // the loaded ExpenseRead (expense.friendship / expense.group), so
  // invalidation can target only the affected friendship/group instead
  // of every friendship's transaction list in the cache.
  friendshipId?: string
  groupId?: string
}

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, DeleteExpenseVariables>({
    mutationFn: async ({ id }: DeleteExpenseVariables) => {
      const { error } = await apiClient.DELETE('/api/expenses/{id}/', {
        params: { path: { id } },
      })
      if (error) throw toApiError(error)
    },
    onSuccess: (_data, { friendshipId, groupId }) => {
      if (friendshipId) queryClient.invalidateQueries({ queryKey: ['friendship-transactions', friendshipId] })
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ['group-transactions', groupId] })
        queryClient.invalidateQueries({ queryKey: ['group-balance', groupId] })
      }
      queryClient.invalidateQueries({ queryKey: ['user-ledgers'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      // The "My Expenses" feed includes personal expenses plus any
      // friendship/group expense the caller has a split in, so a delete
      // of any of those can change it too.
      queryClient.invalidateQueries({ queryKey: ['my-expenses-summary'] })
      queryClient.invalidateQueries({ queryKey: ['my-expenses-list'] })
      queryClient.invalidateQueries({ queryKey: ['my-expenses-report'] })
      queryClient.invalidateQueries({ queryKey: ['category-budgets'] })
    },
  })
}
