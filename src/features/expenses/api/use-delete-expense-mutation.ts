import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { markLocalExpenseDeleted } from '@/lib/sqlite/expenses-store'
import { useAuthStore } from '@/store/use-auth-store'

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
      await queueMutation({
        resource: 'expenses', method: 'DELETE', path: `/api/expenses/${id}/`, optimisticResult: undefined,
      })
      const ownerId = useAuthStore.getState().userProfile?.id
      if (ownerId) await markLocalExpenseDeleted(ownerId, id)
      queryClient.removeQueries({ queryKey: ['expense', id] })
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
