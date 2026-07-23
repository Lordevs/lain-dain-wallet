import { useEffect, useState } from 'react'
import { useCreateFriendshipMutation } from '@/features/contacts/api/use-friendship-mutations'
import type { components } from '@/lib/api/schema'
import type { ApiError } from '@/lib/api/errors'

/**
 * Ensures a Friendship exists with `userId` and returns it directly from
 * the create-or-get response — deliberately NOT derived from
 * GET /api/expenses/with/{user_id}/'s `ledgers` list (see
 * useContactLedgers), because that list is built from PairwiseBalance
 * rows, which don't exist until an expense/settlement has actually
 * happened. A brand-new friendship with zero history would show an empty
 * `ledgers` array, so deriving friendshipId from it is a chicken-and-egg
 * bug for exactly the "add the first-ever expense" case this hook exists
 * for. `POST /api/ledger/friendships/` is idempotent and always returns
 * the Friendship (with `.friend`, everything the add-expense screen
 * needs to render), whether or not any ledger activity exists yet.
 */
export function useEnsureFriendship(userId: string | undefined) {
  const createFriendship = useCreateFriendshipMutation()
  const [result, setResult] = useState<{
    forUserId: string
    friendship?: components['schemas']['Friendship']
    error?: ApiError
  } | null>(null)

  useEffect(() => {
    if (!userId) return
    createFriendship.mutate(
      { userId },
      {
        onSuccess: (friendship) => setResult({ forUserId: userId, friendship }),
        onError: (error) => setResult({ forUserId: userId, error }),
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const current = result?.forUserId === userId ? result : null

  return {
    isLoading: !current,
    isError: !!current?.error,
    error: current?.error,
    friendship: current?.friendship,
  }
}
