import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

/** POST /api/expenses/categories/reorder/ — category_ids is the new
 * top-to-bottom order for as many of the caller's visible categories
 * (system + own) as they dragged; returns the full re-sorted list. */
export function useReorderCategoriesMutation() {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['Category'][], ApiError, string[]>({
    mutationFn: async (categoryIds: string[]) => {
      const { data, error } = await apiClient.POST('/api/expenses/categories/reorder/', {
        body: { category_ids: categoryIds },
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['category-budgets'] })
    },
  })
}
