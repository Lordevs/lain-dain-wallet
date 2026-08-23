import { onlineManager } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { apiClient } from '@/lib/api/client'
import { ApiError, isTransientApiError, toApiError } from '@/lib/api/errors'
import { useAuthStore } from '@/store/use-auth-store'
import type { components } from '@/lib/api/schema'
import { buildPersonalExpenseFormData, type PersonalExpenseFormValues } from '@/features/expenses/lib/build-personal-expense-form-data'
import { buildFriendshipExpenseFormData, type FriendshipExpenseFormValues } from '@/features/contacts/lib/build-friendship-expense-form-data'
import {
  insertOutboxRow, markOutboxRowSynced, markOutboxRowFailed, markOutboxRowSyncing, markOutboxRowPending,
  getPendingOutboxRows, recoverInterruptedOutboxRows, type OutboxRow,
} from '@/lib/sqlite/outbox-store'
import { insertLocalExpense, markLocalExpenseSynced, markLocalExpenseFailed } from '@/lib/sqlite/expenses-store'
import { runInTransaction } from '@/lib/sqlite/transaction'
import { stageReceiptForOffline, readStagedReceipt, deleteStagedReceipt } from './receipt-staging'
import { createOutboxDrainer } from './outbox-engine'

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
type ExpenseCreateResponse = components['schemas']['ExpenseRead']

export async function queueExpenseCreate(payload: QueuedExpensePayload): Promise<QueueExpenseCreateResult> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const myId = useAuthStore.getState().userProfile?.id ?? ''
  if (!myId) throw new ApiError('Sign in before saving an expense.')
  const profile = useAuthStore.getState().userProfile
  const category = queryClient.getQueryData<components['schemas']['Category'][]>(['categories'])
    ?.find((item) => item.id === payload.values.categoryId)
  if (!category) throw new ApiError('Open the app online once to download expense categories.')

  let localReceiptPath: string | null = null
  if (payload.values.receipt) {
    localReceiptPath = await stageReceiptForOffline(payload.values.receipt, id)
  }

  const userSummary: components['schemas']['UserSummary'] = {
    id: myId,
    full_name: profile?.name ?? 'You',
    phone_number: profile?.phone ?? '',
    image: profile?.avatar ?? null,
  }
  const participant = (userId: string) => userId === myId
    ? userSummary
    : { id: userId, full_name: 'Member', phone_number: '', image: null }
  const payers = payload.kind === 'personal'
    ? [{ ...userSummary, amount: payload.values.amount }]
    : payload.values.payers.map((payer) => ({ ...participant(payer.user_id), amount: payer.amount }))
  const splits = payload.kind === 'personal'
    ? [{ ...userSummary, amount_owed: payload.values.amount, extra_amount: '0.00' }]
    : payload.values.splits.map((split) => ({
        ...participant(split.user_id),
        amount_owed: 'amount_owed' in split ? split.amount_owed ?? '0.00' : '0.00',
        extra_amount: 'extra_amount' in split ? split.extra_amount ?? '0.00' : '0.00',
      }))
  const localExpense = {
    id,
    context: payload.kind,
    friendship: payload.kind === 'friendship' ? payload.friendshipId : null,
    group: payload.kind === 'group' ? payload.groupId : null,
    added_by: userSummary,
    description: payload.values.description,
    amount: payload.values.amount,
    currency: profile?.defaultCurrency ?? 'PKR',
    date: payload.values.date,
    category,
    note: payload.values.note ?? '',
    receipt: payload.values.receipt ?? null,
    split_type: payload.kind === 'personal' ? 'equal' : payload.values.splitType,
    payers,
    splits,
    reactions: [],
    edited_at: null,
    recurring_source: null,
    created_at: now,
  } as components['schemas']['ExpenseRead']

  const localRow = {
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
    ownerId: myId,
    serverExpense: localExpense,
  }

  // Stripped of the (now-stale) local receipt URL — the staged copy at
  // localReceiptPath is what actually gets submitted, from here on. Cast
  // is safe: this only overwrites `receipt`, which every branch of the
  // union already declares — TypeScript just can't verify a spread
  // preserves the kind/values correlation across a discriminated union.
  const storedPayload = { ...payload, values: { ...payload.values, receipt: null } } as QueuedExpensePayload
  const payloadJson = JSON.stringify(storedPayload)

  try {
    await runInTransaction(async () => {
      await insertLocalExpense(localRow, false)
      await insertOutboxRow({
        id, idempotencyKey: id, method: 'POST', payloadJson, localReceiptPath, createdAt: now, ownerId: myId,
      }, false)
    })
  } catch (error) {
    if (localReceiptPath) await deleteStagedReceipt(localReceiptPath)
    throw error
  }

  queryClient.setQueryData(['expense', id], localExpense)
  invalidateQueriesFor(storedPayload)

  if (!onlineManager.isOnline()) {
    return { id, synced: false }
  }

  try {
    const response = await submitOutboxPayload({ idempotencyKey: id, payloadJson, localReceiptPath })
    await finalizeSyncedRow(id, storedPayload, response, localReceiptPath)
    return { id, synced: true }
  } catch (err) {
    if (err instanceof ApiError && !isTransientApiError(err)) {
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
  const { data, error, response } =
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

  if (error) throw toApiError(error, (response as unknown as Response).status)
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
  await markLocalExpenseSynced(id, response.currency, response.receipt ?? null, response)
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

async function getPendingRows(ownerId: string): Promise<OutboxRow[]> {
  await recoverInterruptedOutboxRows(ownerId)
  return getPendingOutboxRows(ownerId)
}

const drain = createOutboxDrainer<OutboxRow>({
  getPendingRows,
  markSyncing: (row) => markOutboxRowSyncing(row.id),
  markPending: (row) => markOutboxRowPending(row.id),
  markFailed: async (row, message) => {
    await markOutboxRowFailed(row.id, message)
    await markLocalExpenseFailed(row.id)
  },
  submitOne: async (row) => {
    const payload: QueuedExpensePayload = JSON.parse(row.payload_json)
    const response = await submitOutboxPayload({
      idempotencyKey: row.idempotency_key,
      payloadJson: row.payload_json,
      localReceiptPath: row.local_receipt_path,
    })
    await finalizeSyncedRow(row.id, payload, response, row.local_receipt_path)
  },
})

/** Drains every pending row in order, oldest first. Safe to call
 * whenever connectivity might have changed — a no-op if offline or
 * already draining. See outbox-engine.ts's createOutboxDrainer for the
 * shared retry/backoff/attempt-cap control flow this and
 * mutation-outbox.ts's drain both run on. */
export async function drainExpenseOutbox(): Promise<boolean> {
  return drain()
}
