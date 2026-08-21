import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { replaceResourceSnapshot } from '@/lib/sqlite/resource-snapshot-store'
import { useAuthStore } from '@/store/use-auth-store'

/** POST /api/expenses/categories/reorder/ — category_ids is the new
 * top-to-bottom order for as many of the caller's visible categories
 * (system + own) as they dragged; returns the full re-sorted list. */
export function useReorderCategoriesMutation() {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['Category'][], ApiError, string[]>({
    mutationFn: async (categoryIds: string[]) => {
      const current = queryClient.getQueryData<components['schemas']['Category'][]>(['categories']) ?? []
      const order = new Map(categoryIds.map((id, index) => [id, index]))
      const optimistic = [...current].sort((a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER))
      const result = await queueMutation({
        resource: 'categories', method: 'POST', path: '/api/expenses/categories/reorder/',
        body: { category_ids: categoryIds }, optimisticResult: optimistic,
      })
      const ownerId = useAuthStore.getState().userProfile?.id
      if (ownerId) await replaceResourceSnapshot(ownerId, 'categories', result.data.map((item) => ({ id: item.id, data: item })))
      queryClient.setQueryData(['categories'], result.data)
      return result.data
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
        queryClient.invalidateQueries({ queryKey: ['category-budgets'] }),
      ])
    },
  })
}
