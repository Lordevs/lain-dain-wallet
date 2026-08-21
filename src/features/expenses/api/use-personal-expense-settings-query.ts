import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { onlineManager } from '@tanstack/react-query'
import { useAuthStore } from '@/store/use-auth-store'
import { getSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import type { components } from '@/lib/api/schema'

/** The "Personal Expense Settings" screens' display/hide/period/budget
 * preferences — created lazily server-side on first access. */
export function usePersonalExpenseSettingsQuery() {
  return useQuery({
    queryKey: ['personal-expense-settings'],
    queryFn: async () => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!onlineManager.isOnline() && ownerId) {
        const local = await getSnapshotRecord<components['schemas']['PersonalExpenseSettings']>(
          ownerId, 'personal-settings', ownerId,
        )
        if (local) return local
      }
      const { data, error } = await apiClient.GET('/api/expenses/my-expenses/settings/')
      if (error) throw toApiError(error)
      return data
    },
    // Rarely changes except through this same settings screen, which
    // already invalidates it on save — safe to hold well past the
    // global 30s default.
    staleTime: 5 * 60_000,
    networkMode: 'always',
  })
}
