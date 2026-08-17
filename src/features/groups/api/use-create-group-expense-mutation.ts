import { useMutation } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import { queueExpenseCreate, type QueueExpenseCreateResult } from '@/lib/sync/expense-outbox'
import type { FriendshipExpenseFormValues as LedgerExpenseFormValues } from '@/features/contacts/lib/build-friendship-expense-form-data'

interface CreateGroupExpenseVariables {
  groupId: string
  values: LedgerExpenseFormValues
}

/** Queues through the offline-safe expense outbox — see
 * use-create-personal-expense-mutation.ts's own doc comment for the
 * shared reasoning (same pattern, group context; same
 * ExpenseCreateSerializer shape as friendship, just N members). */
export function useCreateGroupExpenseMutation() {
  return useMutation<QueueExpenseCreateResult, ApiError, CreateGroupExpenseVariables>({
    mutationFn: ({ groupId, values }) => queueExpenseCreate({ kind: 'group', groupId, values }),
  })
}
