import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

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
        queryClient.invalidateQueries({ queryKey: ['group-used-categories', groupId] })
      }
      if (friendshipId) {
        // 1:1 — exactly one other user; scope to them instead of every
        // cached combined ledger view.
        const friendship = queryClient.getQueryData<components['schemas']['Friendship']>(['friendship', friendshipId])
        queryClient.invalidateQueries({ queryKey: friendship ? ['user-ledgers', friendship.friend.id] : ['user-ledgers'] })
      } else {
        // Group expense — could touch several other members at once, and
        // a delete carries no participant list to scope by; broad
        // invalidation is correct here, just not maximally scoped.
        queryClient.invalidateQueries({ queryKey: ['user-ledgers'] })
      }
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
