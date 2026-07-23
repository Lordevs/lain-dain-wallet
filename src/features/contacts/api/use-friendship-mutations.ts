import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

// Idempotent server-side (200 if the Friendship already existed, 201 if
// this call created it) — safe to call every time a contact's detail
// screen is opened, not just the first time.
export function useCreateFriendshipMutation() {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['Friendship'], ApiError, string>({
    mutationFn: async (userId: string) => {
      const { data, error } = await apiClient.POST('/api/ledger/friendships/', {
        body: { user_id: userId },
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] })
    },
  })
}
