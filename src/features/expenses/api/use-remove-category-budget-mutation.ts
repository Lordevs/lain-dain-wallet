import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'

/** DELETE /api/expenses/my-expenses/category-budgets/{category_id}/ —
 * removes a category's monthly limit (spent still shows, just with no
 * limit/percentage attached). */
export function useRemoveCategoryBudgetMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: async (categoryId: string) => {
      const { error } = await apiClient.DELETE('/api/expenses/my-expenses/category-budgets/{category_id}/', {
        params: { path: { category_id: categoryId } },
      })
      if (error) throw toApiError(error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-budgets'] })
    },
  })
}
