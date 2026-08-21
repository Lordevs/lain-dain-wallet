import { onlineManager } from '@tanstack/react-query'
import { env } from '@/lib/env'
import { refreshAccessToken } from '@/lib/api/client'
import { ApiError, isTransientApiError } from '@/lib/api/errors'
import { useAuthStore } from '@/store/use-auth-store'
import {
  deleteMutation,
  getPendingMutations,
  insertMutation,
  setMutationStatus,
  type MutationOutboxRow,
} from '@/lib/sqlite/mutation-outbox-store'
import {
  deleteStagedFile,
  readStagedFile,
  stageFileForOffline,
  type StagedFile,
} from '@/lib/sync/receipt-staging'

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
  method: 'POST' | 'PATCH' | 'DELETE'
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
  if (!response.ok) {
    let message = 'The queued change could not be synced.'
    try {
      const body = await response.json() as { detail?: string }
      if (body.detail) message = body.detail
    } catch { /* response has no JSON body */ }
    throw new ApiError(message, {}, response.status)
  }
  if (response.status === 204) return undefined
  return await response.json() as T
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

let draining = false

export async function drainMutationOutbox(): Promise<void> {
  if (draining || !onlineManager.isOnline()) return
  const ownerId = useAuthStore.getState().userProfile?.id
  if (!ownerId) return
  draining = true
  try {
    const rows = await getPendingMutations(ownerId)
    for (const row of rows) {
      await setMutationStatus(row.id, 'syncing')
      try {
        await submitMutation(row)
        await removeSyncedMutation(row)
      } catch (error) {
        if (error instanceof ApiError && !isTransientApiError(error)) {
          await setMutationStatus(row.id, 'failed', error.message)
          continue
        }
        await setMutationStatus(row.id, 'pending')
        break
      }
    }
  } finally {
    draining = false
  }
}
