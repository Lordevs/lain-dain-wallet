import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCreateFriendshipMutation } from '@/features/contacts/api/use-friendship-mutations'
import { useUserLedgersQuery } from '@/features/contacts/api/use-user-ledgers-query'

/**
 * Shared by ContactDetailScreen and LedgerBreakdownScreen — both need the
 * same GET /api/expenses/with/{user_id}/ call, and both need a Friendship
 * to exist first (that endpoint 404s until a relationship — friendship or
 * shared group — exists). Ensuring it here means either screen works as a
 * direct deep link, not just when reached through the flow that already
 * created it.
 */
export function useContactLedgers(userId: string | undefined) {
  const createFriendship = useCreateFriendshipMutation()
  const queryClient = useQueryClient()
  // Tracks WHICH user id the friendship-ensure call has completed for,
  // rather than a plain boolean — so switching to a different userId
  // is automatically "not yet ensured" without a synchronous setState
  // inside the effect just to reset it.
  const [ensuredForUserId, setEnsuredForUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!userId) return
    createFriendship.mutate(
      { userId },
      { onSettled: () => setEnsuredForUserId(userId) },
    )
    // Re-run only when the target user changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // A warm cache entry for this exact user already proves the
  // relationship exists (you can't have fetched it successfully before
  // without one) — treat that as "ensured" immediately instead of
  // re-blocking behind the ensure-mutation's round trip on every single
  // mount. This only affects the fast path: a genuinely new contact still
  // waits for the real mutation, same as before, avoiding a 404 race
  // against a relationship that doesn't exist yet.
  const hasCachedData = userId !== undefined && queryClient.getQueryData(['user-ledgers', userId]) !== undefined
  const relationshipEnsured = hasCachedData || ensuredForUserId === userId
  const ledgersQuery = useUserLedgersQuery(relationshipEnsured ? userId : undefined)
  const friendshipItem = ledgersQuery.data?.ledgers.find((l) => l.scope === 'friendship')

  return {
    ...ledgersQuery,
    isLoading: !relationshipEnsured || ledgersQuery.isLoading,
    friendshipId: friendshipItem?.friendship_id ?? undefined,
  }
}
