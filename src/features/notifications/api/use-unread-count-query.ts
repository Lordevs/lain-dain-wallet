import { useQuery, onlineManager } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { useAuthStore } from '@/store/use-auth-store'
import { getResourceSnapshot } from '@/lib/sqlite/resource-snapshot-store'
import type { components } from '@/lib/api/schema'

/** GET /api/notifications/unread-count/ — for the bell-icon badge. */
export function useUnreadNotificationCountQuery() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!onlineManager.isOnline() && ownerId) {
        // The snapshot only ever holds actionable rows (the backend's
        // snapshot view filters to action_status NONE/PENDING), read and
        // unread alike — counting the ones without a read_at replicates
        // UnreadCountView's filter exactly. Offline read/delete/clear
        // actions already update this snapshot in place, so the badge
        // tracks what's on screen.
        const notifications = await getResourceSnapshot<components['schemas']['Notification']>(
          ownerId, 'notifications',
        )
        return { count: notifications.filter((notification) => !notification.read_at).length }
      }
      const { data, error } = await apiClient.GET('/api/notifications/unread-count/')
      if (error) throw toApiError(error)
      return data
    },
    // The badge should never show stale unread state — overrides the
    // global 30s default.
    staleTime: 0,
    networkMode: 'always',
  })
}
