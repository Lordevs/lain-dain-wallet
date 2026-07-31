import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

type Friendship = components['schemas']['Friendship']

function useFriendshipAction(
  friendshipId: string,
  action: 'block' | 'unblock',
) {
  const queryClient = useQueryClient()

  return useMutation<Friendship, ApiError, void>({
    mutationFn: async () => {
      if (action === 'block') {
        const result = await apiClient.POST('/api/ledger/friendships/{friendship_id}/block/', {
            params: { path: { friendship_id: friendshipId } },
          })
        const { data, error } = result as { data?: Friendship; error?: unknown }
        if (error || !data) throw toApiError(error)
        return data
      }
      const result = await apiClient.POST('/api/ledger/friendships/{friendship_id}/unblock/', {
        params: { path: { friendship_id: friendshipId } },
      })
      const { data, error } = result as { data?: Friendship; error?: unknown }
      if (error || !data) throw toApiError(error)
      return data
    },
    onSuccess: (friendship) => {
      queryClient.setQueryData(['friendship', friendshipId], friendship)
      queryClient.invalidateQueries({ queryKey: ['friendships'] })
      toast.success(action === 'block' ? 'Contact blocked' : 'Contact unblocked')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useBlockFriendshipMutation(friendshipId: string) {
  return useFriendshipAction(friendshipId, 'block')
}

export function useUnblockFriendshipMutation(friendshipId: string) {
  return useFriendshipAction(friendshipId, 'unblock')
}

export function useUpdateFriendshipExchangeRateMutation(friendshipId: string) {
  const queryClient = useQueryClient()

  return useMutation<Friendship, ApiError, string>({
    mutationFn: async (exchangeRate) => {
      const { data, error } = await apiClient.PATCH('/api/ledger/friendships/{friendship_id}/exchange-rate/', {
        params: { path: { friendship_id: friendshipId } },
        body: { exchange_rate: exchangeRate },
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: (friendship) => {
      queryClient.setQueryData(['friendship', friendshipId], friendship)
      toast.success('Exchange rate updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useClearFriendshipHistoryMutation(friendshipId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      const { error } = await apiClient.POST('/api/expenses/friendships/{friendship_id}/clear-history/', {
        params: { path: { friendship_id: friendshipId } },
      })
      if (error) throw toApiError(error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendship', friendshipId] })
      queryClient.invalidateQueries({ queryKey: ['friendship-balance', friendshipId] })
      queryClient.invalidateQueries({ queryKey: ['friendship-transactions', friendshipId] })
      queryClient.invalidateQueries({ queryKey: ['user-ledgers'] })
      queryClient.invalidateQueries({ queryKey: ['friendship-recurring', friendshipId] })
      toast.success('Ledger history cleared')
    },
    onError: (error) => toast.error(error.message),
  })
}
