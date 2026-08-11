import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'

/** Sends a real ephemeral FCM push to the signed-in user's registered
 * devices. It does not create an item in the notification inbox. */
export function useTestNotificationMutation() {
  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      const { error } = await apiClient.POST('/api/notifications/test/')
      if (error) throw toApiError(error)
    },
  })
}
