import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

/** GET /api/notifications/unread-count/ — for the bell-icon badge. */
export function useUnreadNotificationCountQuery() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/notifications/unread-count/')
      if (error) throw toApiError(error)
      return data
    },
  })
}
