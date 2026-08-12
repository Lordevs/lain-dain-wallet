import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { DeviceContact } from '@/lib/device-contacts'

export function useContactSyncMutation() {
  const queryClient = useQueryClient()

  return useMutation<number, ApiError, DeviceContact[]>({
    mutationFn: async (contacts: DeviceContact[]) => {
      // This must remain one authoritative snapshot request. The backend
      // atomically replaces only this user's rows, which also repairs legacy
      // ciphertext after an encryption-key rotation. Chunking would cause
      // each later chunk to erase the previous one.
      const { data, error, response } = await apiClient.POST('/api/contacts/sync/', {
        body: {
          contacts: contacts.map((c) => ({ phone_number: c.phoneNumber, display_name: c.displayName })),
        },
      })
      const httpStatus = response.status
      if (error) {
        const apiError = toApiError(error)
        if (apiError.message === 'Something went wrong. Please try again.') {
          throw new ApiError(`Contact sync API failed with HTTP ${httpStatus}.`)
        }
        throw apiError
      }
      return data.synced_count
    },
    onSuccess: async () => {
      // Keep the mutation pending until both on-app and invite lists have
      // actually refreshed. Otherwise iOS briefly reports "sync complete"
      // while the screen is still rendering the pre-sync cache.
      await queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}
