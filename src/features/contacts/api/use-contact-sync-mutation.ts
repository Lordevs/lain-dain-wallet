import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { DeviceContact } from '@/lib/device-contacts'

// ContactSyncRequestSerializer caps a single call at 5000 items — chunk
// defensively so a large address book never 400s outright. Real phone
// contact lists are almost always well under this in one chunk anyway.
const SYNC_CHUNK_SIZE = 1000

export function useContactSyncMutation() {
  const queryClient = useQueryClient()

  return useMutation<number, ApiError, DeviceContact[]>({
    mutationFn: async (contacts: DeviceContact[]) => {
      let syncedCount = 0
      for (let i = 0; i < contacts.length; i += SYNC_CHUNK_SIZE) {
        const chunk = contacts.slice(i, i + SYNC_CHUNK_SIZE)
        const { data, error, response } = await apiClient.POST('/api/contacts/sync/', {
          body: {
            contacts: chunk.map((c) => ({ phone_number: c.phoneNumber, display_name: c.displayName })),
          },
        })
        const httpStatus = response.status
        if (error) {
          const apiError = toApiError(error)
          // Some proxy/500 responses have no DRF JSON body, which previously
          // collapsed to an unhelpful generic message. Preserve the HTTP
          // status so native logs identify the failing backend path precisely.
          if (apiError.message === 'Something went wrong. Please try again.') {
            throw new ApiError(`Contact sync API failed with HTTP ${httpStatus}.`)
          }
          throw apiError
        }
        syncedCount += data.synced_count
      }
      return syncedCount
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}
