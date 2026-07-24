import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

interface SetCategoryBudgetVariables {
  categoryId: string
  limitAmount: string
}

/** PUT /api/expenses/my-expenses/category-budgets/{category_id}/ — set
 * (or update) one category's monthly limit. */
export function useSetCategoryBudgetMutation() {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['CategoryBudgetItem'], ApiError, SetCategoryBudgetVariables>({
    mutationFn: async ({ categoryId, limitAmount }) => {
      const { data, error } = await apiClient.PUT('/api/expenses/my-expenses/category-budgets/{category_id}/', {
        params: { path: { category_id: categoryId } },
        body: { limit_amount: limitAmount },
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-budgets'] })
    },
  })
}
