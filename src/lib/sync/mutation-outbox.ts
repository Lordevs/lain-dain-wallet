import { onlineManager } from '@tanstack/react-query'
import { env } from '@/lib/env'
import { refreshAccessToken } from '@/lib/api/client'
import { ApiError, isTransientApiError } from '@/lib/api/errors'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/store/use-auth-store'
import {
  deleteMutation,
  getPendingMutations,
  insertMutation,
  setMutationStatus,
  type MutationOutboxRow,
} from '@/lib/sqlite/mutation-outbox-store'
import { runInTransaction } from '@/lib/sqlite/transaction'
import { deleteSnapshotRecord, upsertSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import type { components } from '@/lib/api/schema'
import {
  deleteStagedFile,
  readStagedFile,
  stageFileForOffline,
  type StagedFile,
} from '@/lib/sync/receipt-staging'
import { createOutboxDrainer } from './outbox-engine'

interface MultipartFileInput {
  field: string
  sourceUri: string
  filename: string
  mimeType?: string
}

interface MultipartInput {
  fields: Array<[string, string]>
  file?: MultipartFileInput
}

type StoredMutationBody =
  | { kind: 'json'; value: unknown }
  | { kind: 'multipart'; fields: Array<[string, string]>; file?: StagedFile & { field: string } }

interface QueueMutationInput<T> {
  resource: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  body?: unknown
  multipart?: MultipartInput
  optimisticResult: T
}

export interface QueuedMutationResult<T> {
  data: T
  synced: boolean
}

export async function queueMutation<T>(input: QueueMutationInput<T>): Promise<QueuedMutationResult<T>> {
  const ownerId = useAuthStore.getState().userProfile?.id
  if (!ownerId) throw new ApiError('Sign in before making changes.')
  if (input.body !== undefined && input.multipart) {
    throw new ApiError('A queued mutation cannot have both JSON and multipart bodies.')
  }
  const id = crypto.randomUUID()
  let storedBody: StoredMutationBody | undefined
  if (input.multipart) {
    const staged = input.multipart.file
      ? await stageFileForOffline(
        input.multipart.file.sourceUri,
        id,
        input.multipart.file.filename,
        input.multipart.file.mimeType,
      )
      : undefined
    storedBody = {
      kind: 'multipart',
      fields: input.multipart.fields,
      file: staged && { ...staged, field: input.multipart.file!.field },
    }
  } else if (input.body !== undefined) {
    storedBody = { kind: 'json', value: input.body }
  }
  const row: MutationOutboxRow = {
    id,
    owner_id: ownerId,
    resource: input.resource,
    method: input.method,
    path: input.path,
    body_json: storedBody ? JSON.stringify(storedBody) : null,
    status: 'pending',
    attempt_count: 0,
    last_error: null,
    created_at: new Date().toISOString(),
  }
  await insertMutation(row)
  if (!onlineManager.isOnline()) return { data: input.optimisticResult, synced: false }

  try {
    const data = await submitMutation<T>(row)
    await removeSyncedMutation(row)
    return { data: data ?? input.optimisticResult, synced: true }
  } catch (error) {
    if (error instanceof ApiError && !isTransientApiError(error)) {
      await setMutationStatus(row.id, 'failed', error.message)
      throw error
    }
    return { data: input.optimisticResult, synced: false }
  }
}

async function submitMutation<T>(row: MutationOutboxRow): Promise<T | undefined> {
  let token = useAuthStore.getState().accessToken
  const storedBody = decodeStoredBody(row.body_json)
  const requestBody = await buildRequestBody(storedBody)
  const send = () => fetch(`${env.apiBaseUrl}${row.path}`, {
    method: row.method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Idempotency-Key': row.id,
      ...(storedBody?.kind === 'json' ? { 'Content-Type': 'application/json' } : {}),
    },
    body: requestBody,
  })

  let response = await send()
  if (response.status === 401) {
    token = await refreshAccessToken()
    if (token) response = await send()
  }
  // Mark-read and delete are desired-state operations. A notification may
  // already have disappeared on another device (or after a previous sync),
  // so a 404 means these specific changes are already satisfied. Keeping the
  // row failed would make the sync warning impossible to clear.
  if (response.status === 404 && isSatisfiedMissingNotificationMutation(row)) {
    return undefined
  }
  if (!response.ok) {
    let message = 'The queued change could not be synced.'
    try {
      const body = await response.json() as { detail?: string }
      if (body.detail) message = body.detail
    } catch { /* response has no JSON body */ }
    const resolvedCategory = await resolveDuplicateCategoryCreate(row, response.status, message, token)
    if (resolvedCategory) return resolvedCategory as T
    throw new ApiError(message, {}, response.status)
  }
  if (response.status === 204) return undefined
  return await response.json() as T
}

const DUPLICATE_CATEGORY_MESSAGE = /^You already have a category named ".+"\.$/

/**
 * A category may have reached the server even though the client never
 * received its successful response (or another device created the same name).
 * In that case the queued create is already satisfied. Repoint subsequent
 * local work at the canonical server category before dropping the row.
 */
async function resolveDuplicateCategoryCreate(
  row: MutationOutboxRow,
  status: number,
  message: string,
  token: string | null,
): Promise<components['schemas']['Category'] | null> {
  if (
    row.resource !== 'categories'
    || row.method !== 'POST'
    || row.path !== '/api/expenses/categories/'
    || status !== 400
    || !DUPLICATE_CATEGORY_MESSAGE.test(message)
  ) return null

  const body = decodeStoredBody(row.body_json)
  if (body?.kind !== 'json' || !isCategoryCreateBody(body.value)) return null
  const categoryCreate = body.value

  let payload: { results?: components['schemas']['Category'][] }
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/expenses/categories/?page_size=100`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) return null
    payload = await response.json() as { results?: components['schemas']['Category'][] }
  } catch {
    // Preserve the original validation error if reconciliation itself cannot
    // reach the server; it remains safely retryable from the sync panel.
    return null
  }
  const category = payload.results?.find((item) => (
    !item.is_system && normalizeCategoryName(item.name) === normalizeCategoryName(categoryCreate.name)
  ))
  if (!category) return null

  await reconcileDuplicateCategory(row.owner_id, categoryCreate.id, category)
  return category
}

function isCategoryCreateBody(value: unknown): value is { id: string; name: string } {
  return typeof value === 'object' && value !== null
    && typeof (value as { id?: unknown }).id === 'string'
    && typeof (value as { name?: unknown }).name === 'string'
}

function normalizeCategoryName(value: string): string {
  return value.trim().toLocaleLowerCase()
}

async function reconcileDuplicateCategory(
  ownerId: string,
  obsoleteCategoryId: string,
  category: components['schemas']['Category'],
): Promise<void> {
  if (obsoleteCategoryId === category.id) return

  await runInTransaction(async (db) => {
    // Queued expenses and mutations may have been created after the category
    // while offline. UUID replacement is safe here: it only replaces this
    // exact client-generated identifier, never a display value.
    await db.run(
      `UPDATE expense_outbox SET payload_json = REPLACE(payload_json, ?, ?) WHERE owner_id = ?`,
      [obsoleteCategoryId, category.id, ownerId],
      false,
    )
    await db.run(
      `UPDATE mutation_outbox SET body_json = REPLACE(body_json, ?, ?) WHERE owner_id = ?`,
      [obsoleteCategoryId, category.id, ownerId],
      false,
    )

    const result = await db.query(
      `SELECT id, server_json FROM expenses WHERE owner_id = ? AND category_id = ?`,
      [ownerId, obsoleteCategoryId],
    )
    for (const expense of result.values ?? []) {
      const serverExpense = JSON.parse(expense.server_json as string) as { category?: unknown }
      serverExpense.category = category
      await db.run(
        `UPDATE expenses SET category_id = ?, server_json = ?, updated_at = ? WHERE owner_id = ? AND id = ?`,
        [category.id, JSON.stringify(serverExpense), new Date().toISOString(), ownerId, expense.id as string],
        false,
      )
    }
  })

  await deleteSnapshotRecord(ownerId, 'categories', obsoleteCategoryId)
  await upsertSnapshotRecord(ownerId, 'categories', { id: category.id, data: category })
  queryClient.setQueryData<components['schemas']['Category'][]>(['categories'], (old = []) => {
    const withoutObsolete = old.filter((item) => item.id !== obsoleteCategoryId)
    return withoutObsolete.some((item) => item.id === category.id)
      ? withoutObsolete
      : [...withoutObsolete, category]
  })
}

function isSatisfiedMissingNotificationMutation(row: MutationOutboxRow): boolean {
  if (row.resource !== 'notifications') return false
  const notificationItemPath = /^\/api\/notifications\/[^/]+\/$/
  const notificationReadPath = /^\/api\/notifications\/[^/]+\/read\/$/
  return (row.method === 'DELETE' && notificationItemPath.test(row.path))
    || (row.method === 'POST' && notificationReadPath.test(row.path))
}

function decodeStoredBody(value: string | null): StoredMutationBody | undefined {
  if (!value) return undefined
  const parsed = JSON.parse(value) as StoredMutationBody | unknown
  if (typeof parsed === 'object' && parsed !== null && 'kind' in parsed) {
    return parsed as StoredMutationBody
  }
  // Rows created before multipart support stored the JSON value directly.
  return { kind: 'json', value: parsed }
}

async function buildRequestBody(body: StoredMutationBody | undefined): Promise<BodyInit | null> {
  if (!body) return null
  if (body.kind === 'json') return JSON.stringify(body.value)
  const formData = new FormData()
  for (const [key, value] of body.fields) formData.append(key, value)
  if (body.file) {
    formData.append(body.file.field, await readStagedFile(body.file), body.file.filename)
  }
  return formData
}

async function removeSyncedMutation(row: MutationOutboxRow): Promise<void> {
  const body = decodeStoredBody(row.body_json)
  await deleteMutation(row.id)
  if (body?.kind === 'multipart' && body.file) await deleteStagedFile(body.file.path)
}

function isPrerequisiteCreate(row: MutationOutboxRow): boolean {
  if (row.method !== 'POST') return false
  return row.path === '/api/ledger/groups/'
    || row.path === '/api/ledger/friendships/'
    || row.path === '/api/expenses/categories/'
}

const drain = createOutboxDrainer<MutationOutboxRow>({
  getPendingRows: getPendingMutations,
  markSyncing: (row) => setMutationStatus(row.id, 'syncing'),
  markPending: (row) => setMutationStatus(row.id, 'pending'),
  markFailed: (row, message) => setMutationStatus(row.id, 'failed', message),
  submitOne: async (row) => {
    await submitMutation(row)
    await removeSyncedMutation(row)
  },
})

export async function drainMutationPrerequisites(): Promise<boolean> {
  return drain(isPrerequisiteCreate)
}

export async function drainMutationOutbox(): Promise<boolean> {
  return drain()
}
