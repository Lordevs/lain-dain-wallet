import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { onlineManager } from '@tanstack/react-query'
import { useAuthStore } from '@/store/use-auth-store'
import { getLocalExpense, upsertServerExpense } from '@/lib/sqlite/expenses-store'

/** GET /api/expenses/{id}/ — a flat lookup, not nested under a
 * friendship/group path, so this works from just the expense id in the
 * URL regardless of which ledger it belongs to. */
export function useExpenseQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['expense', id],
    queryFn: async () => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!onlineManager.isOnline() && ownerId) {
        const local = await getLocalExpense(ownerId, id!)
        if (local) return local
      }
      const { data, error } = await apiClient.GET('/api/expenses/{id}/', {
        params: { path: { id: id! } },
      })
      if (error) throw toApiError(error)
      if (ownerId) {
        await upsertServerExpense(ownerId, {
          ...data, updated_at: data.edited_at ?? data.created_at, is_deleted: false, deleted_at: null,
        })
      }
      return data
    },
    enabled: !!id,
    networkMode: 'always',
  })
}
