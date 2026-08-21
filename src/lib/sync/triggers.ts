import { onlineManager } from '@tanstack/react-query'
import { drainExpenseOutbox } from './expense-outbox'
import { pullExpenseChanges } from './expense-pull'
import { useAuthStore } from '@/store/use-auth-store'
import { drainMutationOutbox, drainMutationPrerequisites } from './mutation-outbox'
import { pullOfflineSnapshot } from './offline-snapshot'

export async function syncOfflineData(): Promise<void> {
  if (!await drainMutationPrerequisites()) return
  await drainExpenseOutbox()
  await drainMutationOutbox()
  await pullExpenseChanges()
  await pullOfflineSnapshot()
}

/**
 * Wires every "connectivity might have just become available" signal to
 * a sync attempt, for every syncable resource's outbox (currently just
 * Expense — see expense-outbox.ts; future resources register their own
 * drain function here the same way). Safe to call liberally:
 * drainExpenseOutbox() no-ops if already draining or genuinely still
 * offline, so there's no harm firing on every reconnect event or app
 * boot regardless of whether anything is actually queued.
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
    if (state.isAuthenticated && !previous.isAuthenticated) void syncOfflineData()
  })

  // Cold start: onlineManager's real status hasn't resolved from native
  // yet at this exact point (Network.getStatus() is async), so this may
  // fire while still effectively unknown/offline — harmless either way,
  // since drainExpenseOutbox's own online check (and, worst case, a
  // failed fetch treated as a transient error) makes this self-correcting.
  void syncOfflineData()
}
