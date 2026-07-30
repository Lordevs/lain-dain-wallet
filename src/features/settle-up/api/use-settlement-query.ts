import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

/** GET /api/expenses/settlements/{id}/ — visible to either payer or payee,
 * regardless of who's allowed to actually act on it (see confirm/dispute/
 * cancel mutations for the narrower per-action checks). */
export function useSettlementQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['settlement', id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/expenses/settlements/{id}/', {
        params: { path: { id: id! } },
      })
      if (error) throw toApiError(error)
      return data
    },
    enabled: !!id,
  })
}
