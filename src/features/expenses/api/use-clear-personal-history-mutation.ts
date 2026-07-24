import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'

/** POST /api/expenses/personal/clear-history/ — "Clear All Personal
 * Expenses" Danger Zone action. Always targets the caller's own
 * PERSONAL-context expenses; no id/permission to get wrong. */
export function useClearPersonalHistoryMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      const { error } = await apiClient.POST('/api/expenses/personal/clear-history/')
      if (error) throw toApiError(error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-expenses-summary'] })
      queryClient.invalidateQueries({ queryKey: ['my-expenses-list'] })
      queryClient.invalidateQueries({ queryKey: ['my-expenses-report'] })
      queryClient.invalidateQueries({ queryKey: ['category-budgets'] })
    },
  })
}
