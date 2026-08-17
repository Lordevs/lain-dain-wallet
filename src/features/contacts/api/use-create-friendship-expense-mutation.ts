import { useMutation } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import { queueExpenseCreate, type QueueExpenseCreateResult } from '@/lib/sync/expense-outbox'
import type { FriendshipExpenseFormValues } from '../lib/build-friendship-expense-form-data'

interface CreateFriendshipExpenseVariables {
  friendshipId: string
  values: FriendshipExpenseFormValues
}

/** Queues through the offline-safe expense outbox — see
 * use-create-personal-expense-mutation.ts's own doc comment for the
 * shared reasoning (same pattern, friendship context). */
export function useCreateFriendshipExpenseMutation() {
  return useMutation<QueueExpenseCreateResult, ApiError, CreateFriendshipExpenseVariables>({
    mutationFn: ({ friendshipId, values }) => queueExpenseCreate({ kind: 'friendship', friendshipId, values }),
  })
}
