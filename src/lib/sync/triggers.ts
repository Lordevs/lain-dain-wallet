import { onlineManager } from '@tanstack/react-query'
import { drainExpenseOutbox } from './expense-outbox'
import { pullExpenseChanges } from './expense-pull'
import { pullSettlementChanges } from './settlement-pull'
import { useAuthStore } from '@/store/use-auth-store'
import { canAttempt, recordSuccess, recordTransientFailure, type SyncChannel } from './backoff'
import { drainMutationOutbox, drainMutationPrerequisites } from './mutation-outbox'
import { pullOfflineSnapshot } from './offline-snapshot'

export interface SyncOfflineDataOptions {
  /** Skip the backoff gate for this attempt. Only for an explicitly
   * user-initiated retry (useSyncStatus's retry button) — the user just
   * reset their failed rows on purpose, so a recently-failed backend
   * shouldn't keep the door shut on them. Trigger-driven callers leave
   * this unset so a failing server is paced, not hammered. */
  force?: boolean
}

/**
 * One full sync pass: push (both write outboxes — prerequisite creates
 * first so later mutations' foreign keys resolve), then pull (delta feeds,
 * then the reconciliation snapshot). Each half is gated by its channel's
 * backoff window and reports its own outcome to it, so a failing backend
 * gets retried on an exponential schedule instead of on every
 * reconnect/foreground/cold-start trigger.
 */
export async function syncOfflineData(options: SyncOfflineDataOptions = {}): Promise<void> {
  // Upfront skips mean "nothing was attempted" and happen before any
  // channel runs, so they never feed the failure counters (and the wake-up
  // timer's re-entry lands here while offline, ending its chain cheaply).
  if (!onlineManager.isOnline()) return
  if (!useAuthStore.getState().userProfile?.id) return

  const force = options.force === true
  await runSyncChannel('push', force, async () => {
    if (!await drainMutationPrerequisites()) return false
    const expensesDrained = await drainExpenseOutbox()
    const mutationsDrained = await drainMutationOutbox()
    return expensesDrained && mutationsDrained
  })
  await runSyncChannel('pull', force, async () => {
    const expensesPulled = await pullExpenseChanges()
    const settlementsPulled = await pullSettlementChanges()
    const snapshotPulled = await pullOfflineSnapshot()
    return expensesPulled && settlementsPulled && snapshotPulled
  })
}

/** Runs one channel's stages against its backoff gate. Stages report
 * outcomes by return value (`false` = transient failure stopped them) and
 * are written never to reject — but if one does throw anyway (a bug), it's
 * counted as a transient failure and swallowed rather than becoming an
 * unhandled rejection in the fire-and-forget call sites. */
async function runSyncChannel(
  channel: SyncChannel,
  force: boolean,
  run: () => Promise<boolean>,
): Promise<void> {
  if (!force && !canAttempt(channel)) return
  let succeeded: boolean
  try {
    succeeded = await run()
  } catch {
    succeeded = false
  }
  if (succeeded) recordSuccess(channel)
  else recordTransientFailure(channel, () => void syncOfflineData())
}

/**
 * Wires every "connectivity might have just become available" signal to
 * a sync attempt, for every syncable resource's outbox (currently just
 * Expense — see expense-outbox.ts; future resources register their own
 * drain function here the same way). Safe to call liberally: each channel
 * runs at most one attempt per its current backoff window, and the drains/
 * pulls themselves no-op when already running or genuinely still offline,
 * so there's no harm firing on every reconnect event or app boot
 * regardless of whether anything is actually queued.
 *
 * Call once from main.tsx, alongside setUpNetworkStatusListener() (whose
 * job is only feeding onlineManager from native status, not reacting to
 * it). The app-foreground trigger lives separately, in
 * use-capacitor-setup.ts's own existing appStateChange listener — no
 * reason to duplicate that registration here.
 */
export function setUpSyncTriggers(): void {
  onlineManager.subscribe((isOnline) => {
    if (isOnline) void syncOfflineData()
  })

  useAuthStore.subscribe((state, previous) => {
    // Backoff windows are process-wide, not per-account — a fresh sign-in
    // must not inherit the previous session's failing-backend penalty, so
    // both channels reset on the way out.
    if (!state.isAuthenticated && previous.isAuthenticated) {
      recordSuccess('push')
      recordSuccess('pull')
    }
    if (state.isAuthenticated && !previous.isAuthenticated) void syncOfflineData()
  })

  // Cold start: onlineManager's real status hasn't resolved from native
  // yet at this exact point (Network.getStatus() is async), so this may
  // fire while still effectively unknown/offline — harmless either way,
  // since the upfront online check (and, worst case, a failed fetch
  // treated as a transient failure) makes this self-correcting.
  void syncOfflineData()
}
