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
        const { data, error } = await apiClient.POST('/api/contacts/sync/', {
          body: {
            contacts: chunk.map((c) => ({ phone_number: c.phoneNumber, display_name: c.displayName })),
          },
        })
        if (error) throw toApiError(error)
        syncedCount += data.synced_count
      }
      return syncedCount
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}
