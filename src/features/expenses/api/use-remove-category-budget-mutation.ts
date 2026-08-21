import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { transformSnapshotRecords } from '@/lib/sqlite/resource-snapshot-store'
import { useAuthStore } from '@/store/use-auth-store'

/** DELETE /api/expenses/my-expenses/category-budgets/{category_id}/ —
 * removes a category's monthly limit (spent still shows, just with no
 * limit/percentage attached). */
export function useRemoveCategoryBudgetMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: async (categoryId: string) => {
      await queueMutation({
        resource: 'category-budgets', method: 'DELETE',
        path: `/api/expenses/my-expenses/category-budgets/${categoryId}/`, optimisticResult: undefined,
      })
      const ownerId = useAuthStore.getState().userProfile?.id
      if (ownerId) await transformSnapshotRecords<components['schemas']['CategoryBudgetsOverview']>(
        ownerId, 'category-budgets', (record) => {
          const categories = record.data.categories.map((item) => item.category.id === categoryId
            ? { ...item, limit_amount: null, used_percentage: null }
            : item)
          return { ...record, data: {
            ...record.data,
            categories,
            total_budget: categories.reduce((sum, item) => sum + Number(item.limit_amount ?? 0), 0).toFixed(2),
          } }
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-budgets'] })
    },
  })
}
