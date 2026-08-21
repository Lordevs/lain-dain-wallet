import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { transformSnapshotRecords } from '@/lib/sqlite/resource-snapshot-store'
import { useAuthStore } from '@/store/use-auth-store'

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
      const overviews = queryClient.getQueriesData<components['schemas']['CategoryBudgetsOverview']>({ queryKey: ['category-budgets'] })
      const existing = overviews.flatMap(([, value]) => value?.categories ?? []).find((item) => item.category.id === categoryId)
      if (!existing) throw new ApiError('Open category budgets online once before changing them offline.')
      const spent = Number(existing.spent)
      const limit = Number(limitAmount)
      const optimistic = { ...existing, limit_amount: limitAmount, used_percentage: limit > 0 ? (spent / limit) * 100 : null }
      const result = await queueMutation({
        resource: 'category-budgets', method: 'PUT',
        path: `/api/expenses/my-expenses/category-budgets/${categoryId}/`,
        body: { limit_amount: limitAmount }, optimisticResult: optimistic,
      })
      const ownerId = useAuthStore.getState().userProfile?.id
      if (ownerId) await transformSnapshotRecords<components['schemas']['CategoryBudgetsOverview']>(
        ownerId, 'category-budgets', (record) => {
          const categories = record.data.categories.map((item) => item.category.id === categoryId
            ? {
                ...item,
                limit_amount: limitAmount,
                used_percentage: Number(limitAmount) > 0 ? (Number(item.spent) / Number(limitAmount)) * 100 : null,
              }
            : item)
          return { ...record, data: {
            ...record.data,
            categories,
            total_budget: categories.reduce((sum, item) => sum + Number(item.limit_amount ?? 0), 0).toFixed(2),
          } }
        },
      )
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-budgets'] })
    },
  })
}
