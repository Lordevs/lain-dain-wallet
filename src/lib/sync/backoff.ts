/**
 * Exponential backoff for sync attempts, keyed by channel. Every
 * reconnect/foreground/cold-start trigger used to re-attempt a full
 * drain+pull immediately (see triggers.ts), so a half-up backend got
 * hammered by rapid-fire triggers — and worse, each pass burned one of an
 * outbox row's persisted MAX_TRANSIENT_ATTEMPTS, so a flaky network could
 * exhaust a queued write's retry budget within seconds and strand it as
 * 'failed'. Pacing attempts through here spreads that same budget over
 * minutes instead.
 *
 * Channels split at the push/pull boundary rather than per resource: a
 * failing backend fails every pull together, while push (the queued-write
 * outboxes) and pull (delta feeds + snapshot) fail independently often
 * enough that neither should inherit the other's penalty.
 *
 * State is deliberately in-memory only:
 * - This is advisory pacing, not durability. A cold start intentionally
 *   gets a fresh attempt — the app may be relaunching precisely because
 *   things recovered, and the durable protections against runaway retries
 *   already live in SQLite (persisted attempt_count caps in both outboxes,
 *   the sync cursors, the pending rows themselves).
 * - For the same reason, re-entrancy guarding stays an in-memory boolean
 *   per drain/pull module rather than becoming a persisted lock: a
 *   persisted mutex deadlocks when the process dies mid-drain. Crash
 *   consistency comes from the drain-time recovery of interrupted
 *   'syncing' rows instead (recoverInterruptedOutboxRows /
 *   getPendingMutations' syncing-recovery UPDATE).
 */

export type SyncChannel = 'push' | 'pull'

const BASE_DELAY_MS = 15_000
const MAX_DELAY_MS = 15 * 60_000

interface ChannelState {
  consecutiveTransientFailures: number
  eligibleAt: number
  retryTimer: ReturnType<typeof setTimeout> | null
}

const channels: Record<SyncChannel, ChannelState> = {
  push: { consecutiveTransientFailures: 0, eligibleAt: 0, retryTimer: null },
  pull: { consecutiveTransientFailures: 0, eligibleAt: 0, retryTimer: null },
}

/** Whether a trigger-driven attempt for this channel may proceed right
 * now. Explicit user-initiated retries bypass this entirely (see
 * syncOfflineData's `force`). */
export function canAttempt(channel: SyncChannel): boolean {
  return Date.now() >= channels[channel].eligibleAt
}

export function recordSuccess(channel: SyncChannel): void {
  const state = channels[channel]
  state.consecutiveTransientFailures = 0
  state.eligibleAt = 0
  if (state.retryTimer) {
    clearTimeout(state.retryTimer)
    state.retryTimer = null
  }
}

/** Records a transient failure and schedules `onBackoffElapsed` once the
 * resulting window passes, so recovery doesn't depend on the user
 * foregrounding/backgrounding the app to generate another trigger. The
 * wake-up itself re-enters syncOfflineData, whose own online/auth checks
 * make it a cheap no-op while still offline (and the reconnect event will
 * trigger a real attempt regardless), so the timer chain always
 * terminates. */
export function recordTransientFailure(channel: SyncChannel, onBackoffElapsed: () => void): void {
  const state = channels[channel]
  state.consecutiveTransientFailures += 1
  const delayMs = Math.min(
    BASE_DELAY_MS * 2 ** (state.consecutiveTransientFailures - 1),
    MAX_DELAY_MS,
  )
  state.eligibleAt = Date.now() + delayMs
  if (state.retryTimer) clearTimeout(state.retryTimer)
  state.retryTimer = setTimeout(() => {
    state.retryTimer = null
    onBackoffElapsed()
  }, delayMs)
}
