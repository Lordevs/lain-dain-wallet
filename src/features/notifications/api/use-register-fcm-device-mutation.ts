import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

type FCMDeviceRequest = components['schemas']['FCMDeviceRequest']

/** POST /api/notifications/devices/ — registers (or, by registration_id,
 * upserts) this device's FCM token against the current user. Called once
 * per app session after push permission is granted; see
 * use-push-notifications.ts. */
export function useRegisterFcmDeviceMutation() {
  return useMutation<void, ApiError, FCMDeviceRequest>({
    mutationFn: async (body: FCMDeviceRequest) => {
      const { error } = await apiClient.POST('/api/notifications/devices/', { body })
      if (error) throw toApiError(error)
    },
  })
}
