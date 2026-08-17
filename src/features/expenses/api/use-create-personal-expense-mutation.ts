import { useMutation } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import { queueExpenseCreate, type QueueExpenseCreateResult } from '@/lib/sync/expense-outbox'
import type { PersonalExpenseFormValues } from '../lib/build-personal-expense-form-data'

/** Queues through the offline-safe expense outbox (see
 * docs/architecture/offline-sync.md and src/lib/sync/expense-outbox.ts)
 * rather than calling the API directly — submits immediately if online
 * (same latency/cache-invalidation as a direct call), or leaves the
 * expense queued for the next drain trigger if not. `synced: false` on
 * the resolved result means "queued, not yet confirmed" — callers that
 * want to tell the user their expense will sync later should check it. */
export function useCreatePersonalExpenseMutation() {
  return useMutation<QueueExpenseCreateResult, ApiError, PersonalExpenseFormValues>({
    mutationFn: (values) => queueExpenseCreate({ kind: 'personal', values }),
  })
}
