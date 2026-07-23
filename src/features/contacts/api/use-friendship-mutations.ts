import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

export interface CreateFriendshipVariables {
  userId: string
  // Both required together, and only accepted, when the two people's
  // default_currency differ — see services.start_friendship. Omitted
  // entirely on the (much more common) same-currency first attempt.
  currency?: string
  exchangeRate?: string
}

// Idempotent server-side (200 if the Friendship already existed, 201 if
// this call created it) — safe to call every time a contact's detail
// screen is opened, not just the first time.
export function useCreateFriendshipMutation() {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['Friendship'], ApiError, CreateFriendshipVariables>({
    mutationFn: async ({ userId, currency, exchangeRate }: CreateFriendshipVariables) => {
      const { data, error } = await apiClient.POST('/api/ledger/friendships/', {
        body: {
          user_id: userId,
          ...(currency && exchangeRate ? { currency, exchange_rate: exchangeRate } : {}),
        },
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] })
    },
  })
}
