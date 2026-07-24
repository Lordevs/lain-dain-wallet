import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'

/** DELETE /api/expenses/categories/{id}/ — only the caller's own custom
 * categories can be deleted (never a system one), and only if no expense
 * still references it (backend raises otherwise — see
 * services.delete_category). */
export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.DELETE('/api/expenses/categories/{id}/', {
        params: { path: { id } },
      })
      if (error) throw toApiError(error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['category-budgets'] })
    },
  })
}
