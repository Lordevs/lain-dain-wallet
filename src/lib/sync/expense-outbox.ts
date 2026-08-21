import { onlineManager } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import { useAuthStore } from '@/store/use-auth-store'
import type { components } from '@/lib/api/schema'
import { buildPersonalExpenseFormData, type PersonalExpenseFormValues } from '@/features/expenses/lib/build-personal-expense-form-data'
import { buildFriendshipExpenseFormData, type FriendshipExpenseFormValues } from '@/features/contacts/lib/build-friendship-expense-form-data'
import {
  insertOutboxRow, markOutboxRowSynced, markOutboxRowFailed, markOutboxRowSyncing, markOutboxRowPending,
  getPendingOutboxRows, type OutboxRow,
} from '@/lib/sqlite/outbox-store'
import { insertLocalExpense, markLocalExpenseSynced, markLocalExpenseFailed } from '@/lib/sqlite/expenses-store'
import { stageReceiptForOffline, readStagedReceipt, deleteStagedReceipt } from './receipt-staging'

/**
 * Offline-safe expense creation — see docs/architecture/offline-sync.md.
 * Every create-expense mutation hook (personal/friendship/group) queues
 * through here instead of calling the API directly. SQLite is the sole
 * durability mechanism for this action (not TanStack's own persisted-
 * mutation replay — see main.tsx's shouldDehydrateMutation, which
 * excludes these): a queued row survives an app restart, and is retried
 * by drainExpenseOutbox() on the next reconnect/foreground/cold-start
 * trigger (src/lib/network.ts, src/lib/app-lifecycle.ts).
 */

export type QueuedExpensePayload =
  | { kind: 'personal'; values: PersonalExpenseFormValues }
  | { kind: 'friendship'; friendshipId: string; values: FriendshipExpenseFormValues }
  | { kind: 'group'; groupId: string; values: FriendshipExpenseFormValues }

export interface QueueExpenseCreateResult {
  id: string
  /** false covers both "queued while offline" and "was online but the
   * immediate submit hit a transient network failure mid-flight" — both
   * resolve the same way from the caller's perspective: queued, will
   * sync on the next drain trigger. Only a permanent (validation/
   * permission) failure throws, matching today's direct-network
   * mutation's error contract exactly. */
  synced: boolean
}

// A structural subset, not components['schemas']['ExpenseRead'] directly —
// the generated type for POST /api/expenses/personal/'s response
// (PersonalExpenseCreate) is actually its *request* serializer's shape
// (missing currency/id/etc entirely), a pre-existing schema-generation
// mismatch: the view always returns ExpenseReadSerializer's JSON
// regardless of context (see _ExpenseListCreateBase.create() in
// apps/expenses/views.py), the generated types just don't reflect that
// for this one endpoint. Only currency/receipt are actually needed here.
interface ExpenseCreateResponse {
  currency: string
  receipt?: string | null
}

export async function queueExpenseCreate(payload: QueuedExpensePayload): Promise<QueueExpenseCreateResult> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const myId = useAuthStore.getState().userProfile?.id ?? ''

  let localReceiptPath: string | null = null
  if (payload.values.receipt) {
    localReceiptPath = await stageReceiptForOffline(payload.values.receipt, id)
  }

  await insertLocalExpense({
    id,
    context: payload.kind,
    friendshipId: payload.kind === 'friendship' ? payload.friendshipId : null,
    groupId: payload.kind === 'group' ? payload.groupId : null,
    addedById: myId,
    description: payload.values.description,
    amount: payload.values.amount,
    date: payload.values.date,
    categoryId: payload.values.categoryId,
    note: payload.values.note ?? '',
    localReceiptPath,
    splitType: payload.kind === 'personal' ? null : payload.values.splitType,
    payersJson: payload.kind === 'personal' ? '[]' : JSON.stringify(payload.values.payers),
    splitsJson: payload.kind === 'personal' ? '[]' : JSON.stringify(payload.values.splits),
    createdAt: now,
  })

  // Stripped of the (now-stale) local receipt URL — the staged copy at
  // localReceiptPath is what actually gets submitted, from here on. Cast
  // is safe: this only overwrites `receipt`, which every branch of the
  // union already declares — TypeScript just can't verify a spread
  // preserves the kind/values correlation across a discriminated union.
  const storedPayload = { ...payload, values: { ...payload.values, receipt: null } } as QueuedExpensePayload
  const payloadJson = JSON.stringify(storedPayload)

  await insertOutboxRow({ id, idempotencyKey: id, method: 'POST', payloadJson, localReceiptPath, createdAt: now })

  if (!onlineManager.isOnline()) {
    return { id, synced: false }
  }

  try {
    const response = await submitOutboxPayload({ idempotencyKey: id, payloadJson, localReceiptPath })
    await finalizeSyncedRow(id, storedPayload, response, localReceiptPath)
    return { id, synced: true }
  } catch (err) {
    if (err instanceof ApiError) {
      await markOutboxRowFailed(id, err.message)
      await markLocalExpenseFailed(id)
      throw err
    }
    // Network-level failure mid-flight (fetch itself rejected, not a
    // resolved error response) — leave the row pending, identical
    // outcome to having been offline from the start.
    return { id, synced: false }
  }
}

/** Rebuilds the multipart request from a queued row's payload and posts
 * it with the row's Idempotency-Key — used both by queueExpenseCreate's
 * immediate-online path and by the deferred drain loop, so there's
 * exactly one place that knows how to actually submit a queued expense. */
async function submitOutboxPayload(row: {
  idempotencyKey: string
  payloadJson: string
  localReceiptPath: string | null
}): Promise<ExpenseCreateResponse> {
  const payload: QueuedExpensePayload = JSON.parse(row.payloadJson)

  const formData =
    payload.kind === 'personal'
      ? await buildPersonalExpenseFormData(payload.values)
      : await buildFriendshipExpenseFormData(payload.values)
  // Client-generated id — see apps/expenses/serializers.py's optional
  // `id` field (Phase 1) and services.create_expense()'s id-or-uuid4
  // fallback. This is what lets the server and client agree on identity
  // before the server has ever seen the record.
  formData.append('id', row.idempotencyKey)

  if (row.localReceiptPath) {
    const blob = await readStagedReceipt(row.localReceiptPath)
    formData.append('receipt', blob, 'receipt.jpg')
  }

  const headers = { 'Idempotency-Key': row.idempotencyKey }
  const { data, error } =
    payload.kind === 'personal'
      ? await apiClient.POST('/api/expenses/personal/', {
          body: formData as unknown as components['schemas']['PersonalExpenseCreateRequest'],
          headers,
        })
      : payload.kind === 'friendship'
        ? await apiClient.POST('/api/expenses/friendships/{friendship_id}/', {
            params: { path: { friendship_id: payload.friendshipId } },
            body: formData as unknown as components['schemas']['ExpenseCreateRequest'],
            headers,
          })
        : await apiClient.POST('/api/expenses/groups/{group_id}/', {
            params: { path: { group_id: payload.groupId } },
            body: formData as unknown as components['schemas']['ExpenseCreateRequest'],
            headers,
          })

  if (error) throw toApiError(error)
  // See ExpenseCreateResponse's own comment — the generated response type
  // for the personal-expense branch doesn't reflect what the backend
  // actually returns (verified directly against apps/expenses/views.py).
  return data as unknown as ExpenseCreateResponse
}

/** Everything that must happen once a queued expense is confirmed
 * synced: reconcile the local row with the server's real
 * currency/receipt URL, drop the outbox row and staged file, and
 * invalidate exactly the query keys today's direct-network mutations
 * invalidate — so an online create still updates every screen it always
 * has, with the outbox as an invisible implementation detail. */
async function finalizeSyncedRow(
  id: string,
  payload: QueuedExpensePayload,
  response: ExpenseCreateResponse,
  localReceiptPath: string | null,
): Promise<void> {
  await markLocalExpenseSynced(id, response.currency, response.receipt ?? null)
  await markOutboxRowSynced(id)
  if (localReceiptPath) await deleteStagedReceipt(localReceiptPath)
  invalidateQueriesFor(payload)
}

function invalidateQueriesFor(payload: QueuedExpensePayload): void {
  if (payload.kind === 'personal') {
    queryClient.invalidateQueries({ queryKey: ['my-expenses-summary'] })
    queryClient.invalidateQueries({ queryKey: ['my-expenses-list'] })
    queryClient.invalidateQueries({ queryKey: ['my-expenses-report'] })
    queryClient.invalidateQueries({ queryKey: ['category-budgets'] })
    return
  }

  if (payload.kind === 'friendship') {
    queryClient.invalidateQueries({ queryKey: ['friendship-transactions', payload.friendshipId] })
    const friendship = queryClient.getQueryData<components['schemas']['Friendship']>(['friendship', payload.friendshipId])
    queryClient.invalidateQueries({
      queryKey: friendship ? ['user-ledgers', friendship.friend.id] : ['user-ledgers'],
    })
    queryClient.invalidateQueries({ queryKey: ['wallet'] })
    return
  }

  queryClient.invalidateQueries({ queryKey: ['group-transactions', payload.groupId] })
  queryClient.invalidateQueries({ queryKey: ['group-balance', payload.groupId] })
  queryClient.invalidateQueries({ queryKey: ['group-used-categories', payload.groupId] })
  const myId = useAuthStore.getState().userProfile?.id
  for (const split of payload.values.splits) {
    if (split.user_id !== myId) {
      queryClient.invalidateQueries({ queryKey: ['user-ledgers', split.user_id] })
    }
  }
  queryClient.invalidateQueries({ queryKey: ['wallet'] })
}

// Re-entrancy guard — a reconnect event and an app-foreground event
// firing close together (or a second call before the first finishes)
// must not drain the same rows twice in parallel.
let isDraining = false

/** Drains every pending row in order, oldest first. Safe to call
 * whenever connectivity might have changed — a no-op if offline or
 * already draining. A row that fails with a permanent (validation/
 * permission) error is marked 'failed' and skipped, not retried forever;
 * everything else stops the drain early (network's down again, or
 * something unexpected) so remaining rows keep their place in line for
 * the next trigger. */
export async function drainExpenseOutbox(): Promise<void> {
  if (isDraining || !onlineManager.isOnline()) return
  isDraining = true
  try {
    const rows = await getPendingOutboxRows()
    for (const row of rows) {
      try {
        await drainOneRow(row)
      } catch {
        // Transient failure — drainOneRow already reverted the row to
        // pending. Stop this pass (see drainOneRow's own comment) without
        // rejecting drainExpenseOutbox itself, so every call site (a
        // reconnect listener, an app-foreground listener, ...) can fire
        // it without needing its own .catch().
        break
      }
    }
  } finally {
    isDraining = false
  }
}

async function drainOneRow(row: OutboxRow): Promise<void> {
  await markOutboxRowSyncing(row.id)
  try {
    const payload: QueuedExpensePayload = JSON.parse(row.payload_json)
    const response = await submitOutboxPayload({
      idempotencyKey: row.idempotency_key,
      payloadJson: row.payload_json,
      localReceiptPath: row.local_receipt_path,
    })
    await finalizeSyncedRow(row.id, payload, response, row.local_receipt_path)
  } catch (err) {
    if (err instanceof ApiError) {
      await markOutboxRowFailed(row.id, err.message)
      await markLocalExpenseFailed(row.id)
      return
    }
    // Transient failure — revert to pending and stop this drain pass;
    // whatever just failed (network dropped again mid-drain) will likely
    // affect the rest of the queue too, and the next trigger retries
    // from here in the same created_at order.
    await markOutboxRowPending(row.id)
    throw err
  }
}
