import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { deleteSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import { useAuthStore } from '@/store/use-auth-store'

/** DELETE /api/expenses/categories/{id}/ — only the caller's own custom
 * categories can be deleted (never a system one), and only if no expense
 * still references it (backend raises otherwise — see
 * services.delete_category). */
export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: async (id: string) => {
      await queueMutation({
        resource: 'categories', method: 'DELETE', path: `/api/expenses/categories/${id}/`, optimisticResult: undefined,
      })
      const ownerId = useAuthStore.getState().userProfile?.id
      if (ownerId) await deleteSnapshotRecord(ownerId, 'categories', id)
      queryClient.setQueryData<components['schemas']['Category'][]>(['categories'], (old = []) => old.filter((item) => item.id !== id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['category-budgets'] })
    },
  })
}
