import { onlineManager } from '@tanstack/react-query'
import { ApiError, isTransientApiError } from '@/lib/api/errors'
import { useAuthStore } from '@/store/use-auth-store'

/**
 * Shared by every offline write-queue (expense-outbox.ts, mutation-
 * outbox.ts) — the actual retry/backoff/crash-recovery/attempt-cap
 * control flow, previously hand-duplicated across both and prone to
 * drifting with every change made to just one (see
 * docs/architecture/offline-sync.md's "legacy expense-specific outbox").
 * Each outbox still owns its own SQLite table, row shape, and
 * resource-specific submit/finalize logic — only the loop itself (mutex,
 * ordering, attempt counting, terminal-vs-transient classification) lives
 * here.
 */

// A transient failure (network blip, a real 5xx) normally just reverts a
// row to 'pending' for the next trigger to retry — but with no cap, a
// mutation that fails the same way every time (e.g. a persistent server
// error) would retry forever on every reconnect/foreground, silently,
// with nothing ever telling the user it's stuck. Past this many attempts
// it's marked 'failed' instead — same terminal state a permanent
// (validation/permission) error already gets, surfaced the same way in
// useSyncStatus, and still retryable manually from there.
export const MAX_TRANSIENT_ATTEMPTS = 8

export interface OutboxRowLike {
  id: string
  attempt_count: number
}

export interface OutboxEngineConfig<Row extends OutboxRowLike> {
  /** Recovers any rows left stuck 'syncing' by a crash mid-drain back to
   * 'pending', then returns every pending row, oldest first. */
  getPendingRows(ownerId: string): Promise<Row[]>
  markSyncing(row: Row): Promise<void>
  markPending(row: Row): Promise<void>
  /** Terminal failure — a permanent (validation/permission) error, or a
   * transient one that's exhausted MAX_TRANSIENT_ATTEMPTS. Whatever local
   * reconciliation a terminal failure needs (e.g. flagging a materialized
   * local row as failed) happens here. */
  markFailed(row: Row, message: string): Promise<void>
  /** Submits one row and does whatever local reconciliation success
   * needs (removing the row, updating a materialized local cache,
   * invalidating queries, ...). Throws ApiError on failure —
   * isTransientApiError distinguishes a retry-worthy failure from a
   * terminal one. */
  submitOne(row: Row): Promise<void>
}

/**
 * Builds a drain function bound to one outbox's config — a fresh,
 * independent re-entrancy mutex per call, so two different outboxes
 * never block each other, only concurrent drains of the *same* one.
 */
export function createOutboxDrainer<Row extends OutboxRowLike>(config: OutboxEngineConfig<Row>) {
  let draining = false

  /** Returns whether this pass finished without hitting a transient
   * failure — the signal syncOfflineData's backoff accounting uses (a
   * held mutex, offline, or signed-out also reports `true`: nothing was
   * attempted, so there's nothing to penalize). Never rejects, so every
   * call site (a reconnect listener, an app-foreground listener, ...) can
   * fire it without needing its own .catch(). */
  return async function drain(predicate: (row: Row) => boolean = () => true): Promise<boolean> {
    if (draining || !onlineManager.isOnline()) return true
    const ownerId = useAuthStore.getState().userProfile?.id
    if (!ownerId) return true
    let completed = true
    draining = true
    try {
      const rows = (await config.getPendingRows(ownerId)).filter(predicate)
      for (const row of rows) {
        await config.markSyncing(row)
        try {
          await config.submitOne(row)
        } catch (error) {
          if (error instanceof ApiError && !isTransientApiError(error)) {
            await config.markFailed(row, error.message)
            continue
          }
          if (row.attempt_count + 1 >= MAX_TRANSIENT_ATTEMPTS) {
            await config.markFailed(row, 'Giving up after repeated attempts — tap retry to try again.')
            continue
          }
          await config.markPending(row)
          completed = false
          break
        }
      }
    } finally {
      draining = false
    }
    return completed
  }
}
