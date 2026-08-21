import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { onlineManager } from '@tanstack/react-query'
import { useAuthStore } from '@/store/use-auth-store'
import { getResourceSnapshot } from '@/lib/sqlite/resource-snapshot-store'
import type { components } from '@/lib/api/schema'

/**
 * GET /api/expenses/categories/ — the 9 system categories plus any the
 * user added themselves. One page (page_size well above any realistic
 * count) rather than walking cursors — this list is small and static
 * enough within a session that over-fetching one page isn't a concern.
 */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!onlineManager.isOnline() && ownerId) {
        return getResourceSnapshot<components['schemas']['Category']>(ownerId, 'categories')
      }
      const { data, error } = await apiClient.GET('/api/expenses/categories/', {
        params: { query: { page_size: 100 } },
      })
      if (error) throw toApiError(error)
      return data.results
    },
    // System + user categories barely ever change within a session —
    // overriding the global 30s default well upward avoids refetching
    // this on every screen that reads it.
    staleTime: 5 * 60_000,
    networkMode: 'always',
  })
}
