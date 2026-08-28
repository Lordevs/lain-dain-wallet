import { onlineManager, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import {
  deleteResourceSnapshotScope,
  getSnapshotRecord,
  upsertSnapshotRecord,
} from '@/lib/sqlite/resource-snapshot-store'
import { useAuthStore } from '@/store/use-auth-store'
import { clearLocalExpenseHistory } from '@/lib/sqlite/expenses-store'

type Friendship = components['schemas']['Friendship']

function useFriendshipAction(
  friendshipId: string,
  action: 'block' | 'unblock',
) {
  const queryClient = useQueryClient()

  return useMutation<Friendship, ApiError, void>({
    mutationFn: async () => {
      const ownerId = useAuthStore.getState().userProfile?.id
      const current = queryClient.getQueryData<Friendship>(['friendship', friendshipId])
        ?? (ownerId ? await getSnapshotRecord<Friendship>(ownerId, 'friendships', friendshipId) : null)
      if (!current) throw new ApiError('Open this contact online once before changing its settings offline.')
      const optimistic = {
        ...current,
        is_blocked: action === 'block',
        blocked_by_me: action === 'block',
      }
      const result = await queueMutation({
        resource: 'friendships', method: 'POST',
        path: `/api/ledger/friendships/${friendshipId}/${action}/`,
        optimisticResult: optimistic,
      })
      if (ownerId) await upsertSnapshotRecord(ownerId, 'friendships', { id: friendshipId, data: result.data })
      return result.data
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
      const ownerId = useAuthStore.getState().userProfile?.id
      const current = queryClient.getQueryData<Friendship>(['friendship', friendshipId])
        ?? (ownerId ? await getSnapshotRecord<Friendship>(ownerId, 'friendships', friendshipId) : null)
      if (!current) throw new ApiError('Open this contact online once before changing its settings offline.')
      const result = await queueMutation({
        resource: 'friendships', method: 'PATCH',
        path: `/api/ledger/friendships/${friendshipId}/exchange-rate/`,
        body: { exchange_rate: exchangeRate },
        optimisticResult: { ...current, exchange_rate: exchangeRate },
      })
      if (ownerId) await upsertSnapshotRecord(ownerId, 'friendships', { id: friendshipId, data: result.data })
      return result.data
    },
    onSuccess: (friendship) => {
      queryClient.setQueryData(['friendship', friendshipId], friendship)
      toast.success('Exchange rate updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

/** `null` resets to inheriting the caller's global
 * PersonalExpenseSettings.auto_reminder_enabled default. */
export function useUpdateFriendshipAutoRemindMutation(friendshipId: string) {
  const queryClient = useQueryClient()

  return useMutation<Friendship, ApiError, boolean | null>({
    mutationFn: async (autoRemindOverride) => {
      const ownerId = useAuthStore.getState().userProfile?.id
      const current = queryClient.getQueryData<Friendship>(['friendship', friendshipId])
        ?? (ownerId ? await getSnapshotRecord<Friendship>(ownerId, 'friendships', friendshipId) : null)
      if (!current) throw new ApiError('Open this contact online once before changing its settings offline.')
      const result = await queueMutation({
        resource: 'friendships', method: 'PATCH',
        path: `/api/ledger/friendships/${friendshipId}/auto-remind/`,
        body: { auto_remind_override: autoRemindOverride },
        optimisticResult: { ...current, my_auto_remind_override: autoRemindOverride },
      })
      if (ownerId) await upsertSnapshotRecord(ownerId, 'friendships', { id: friendshipId, data: result.data })
      return result.data
    },
    onSuccess: (friendship) => {
      queryClient.setQueryData(['friendship', friendshipId], friendship)
      toast.success('Reminder preference updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useClearFriendshipHistoryMutation(friendshipId: string) {
  const queryClient = useQueryClient()

  return useMutation<Friendship, ApiError, void>({
    mutationFn: async () => {
      if (!onlineManager.isOnline()) {
        throw new ApiError(
          'Connect to the internet to verify this ledger is fully settled before clearing its history.',
        )
      }

      const { error: clearError } = await apiClient.POST(
        '/api/expenses/friendships/{friendship_id}/clear-history/',
        { params: { path: { friendship_id: friendshipId } } },
      )
      if (clearError) {
        throw toApiError(clearError)
      }

      // The clear endpoint correctly has no body. Fetching the updated
      // friendship gives the client the server's exact cutoff rather than
      // guessing with the device clock.
      const { data: friendship, error: detailError } = await apiClient.GET('/api/ledger/friendships/{friendship_id}/', {
        params: { path: { friendship_id: friendshipId } },
      })
      if (detailError) {
        throw toApiError(detailError)
      }

      const ownerId = useAuthStore.getState().userProfile?.id
      if (ownerId) {
        await Promise.all([
          clearLocalExpenseHistory(ownerId, { context: 'friendship', id: friendshipId }),
          deleteResourceSnapshotScope(ownerId, 'settlements', friendshipId),
          deleteResourceSnapshotScope(ownerId, 'settlement-ledger', friendshipId),
          upsertSnapshotRecord(ownerId, 'friendships', {
            id: friendshipId,
            data: friendship,
          }),
        ])
      }
      return friendship
    },
    onSuccess: (friendship) => {
      queryClient.setQueryData(['friendship', friendshipId], friendship)
      queryClient.invalidateQueries({ queryKey: ['friendships'] })
      queryClient.invalidateQueries({ queryKey: ['friendship-balance', friendshipId] })
      queryClient.invalidateQueries({ queryKey: ['friendship-transactions', friendshipId] })
      queryClient.invalidateQueries({ queryKey: ['user-ledgers', friendship.friend.id] })
      toast.success('Ledger history cleared from your view')
    },
    onError: (error) => toast.error(error.message),
  })
}
