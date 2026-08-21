import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { clearLocalExpenseHistory } from '@/lib/sqlite/expenses-store'
import { useAuthStore } from '@/store/use-auth-store'

/** POST /api/expenses/personal/clear-history/ — "Clear All Personal
 * Expenses" Danger Zone action. Always targets the caller's own
 * PERSONAL-context expenses; no id/permission to get wrong. */
export function useClearPersonalHistoryMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      await queueMutation({
        resource: 'history', method: 'POST', path: '/api/expenses/personal/clear-history/', optimisticResult: undefined,
      })
      const ownerId = useAuthStore.getState().userProfile?.id
      if (ownerId) await clearLocalExpenseHistory(ownerId, { context: 'personal' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-expenses-summary'] })
      queryClient.invalidateQueries({ queryKey: ['my-expenses-list'] })
      queryClient.invalidateQueries({ queryKey: ['my-expenses-report'] })
      queryClient.invalidateQueries({ queryKey: ['category-budgets'] })
    },
  })
}
