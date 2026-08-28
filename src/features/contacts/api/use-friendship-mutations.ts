import { onlineManager, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { getResourceSnapshot, upsertSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import { useAuthStore } from '@/store/use-auth-store'

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
      const profile = useAuthStore.getState().userProfile
      if (!profile?.id) throw new ApiError('Sign in before starting a friendship.')
      let existing: components['schemas']['Friendship'] | undefined
      try {
        existing = (await getResourceSnapshot<components['schemas']['Friendship']>(
          profile.id, 'friendships',
        )).find((item) => item.friend.id === userId)
      } catch (error) {
        // A broken/unavailable local cache must not prevent the online API
        // flow. Offline, however, the local store is the only source of truth.
        if (!onlineManager.isOnline()) throw error
      }
      if (existing) {
        queryClient.setQueryData(['friendship', existing.id], existing)
        return existing
      }
      const contact = queryClient
        .getQueriesData<InfiniteData<components['schemas']['PaginatedContactList']>>({ queryKey: ['contacts'] })
        .flatMap(([, data]) => data?.pages.flatMap((page) => page.results) ?? [])
        .find((item) => item.lain_dain_user_id === userId)
      if (!contact && !onlineManager.isOnline()) {
        throw new ApiError('Open contacts online once before starting this friendship offline.')
      }
      const id = crypto.randomUUID()
      const optimistic: components['schemas']['Friendship'] = {
        id,
        friend: {
          id: userId,
          full_name: contact?.display_name ?? 'Contact',
          phone_number: contact?.phone_number ?? '',
          image: null,
        },
        created_via: 'manual', created_at: new Date().toISOString(), created: true,
        is_blocked: false, blocked_by_me: false, currency: currency ?? null,
        exchange_rate: exchangeRate ?? null,
        your_currency: profile.defaultCurrency ?? currency ?? '',
        friend_currency: contact?.lain_dain_user_currency ?? currency ?? '',
        total_entries: 0, my_auto_remind_override: null, my_history_cleared_at: null,
      }
      const result = await queueMutation({
        resource: 'friendships', method: 'POST', path: '/api/ledger/friendships/',
        body: { id, user_id: userId, ...(currency && exchangeRate ? { currency, exchange_rate: exchangeRate } : {}) },
        optimisticResult: optimistic,
      })
      await upsertSnapshotRecord(profile.id, 'friendships', { id: result.data.id, data: result.data })
      queryClient.setQueryData(['friendship', result.data.id], result.data)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] })
    },
  })
}
