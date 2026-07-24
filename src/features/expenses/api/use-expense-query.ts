import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

/** GET /api/expenses/{id}/ — a flat lookup, not nested under a
 * friendship/group path, so this works from just the expense id in the
 * URL regardless of which ledger it belongs to. */
export function useExpenseQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['expense', id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/expenses/{id}/', {
        params: { path: { id: id! } },
      })
      if (error) throw toApiError(error)
      return data
    },
    enabled: !!id,
  })
}
