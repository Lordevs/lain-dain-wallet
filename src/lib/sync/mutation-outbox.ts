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

interface QueueMutationInput<T> {
  resource: string
  method: 'POST' | 'PATCH' | 'DELETE'
  path: string
  body?: unknown
  optimisticResult: T
}

export interface QueuedMutationResult<T> {
  data: T
  synced: boolean
}

export async function queueMutation<T>(input: QueueMutationInput<T>): Promise<QueuedMutationResult<T>> {
  const ownerId = useAuthStore.getState().userProfile?.id
  if (!ownerId) throw new ApiError('Sign in before making changes.')
  const row: MutationOutboxRow = {
    id: crypto.randomUUID(),
    owner_id: ownerId,
    resource: input.resource,
    method: input.method,
    path: input.path,
    body_json: input.body === undefined ? null : JSON.stringify(input.body),
    status: 'pending',
    attempt_count: 0,
    last_error: null,
    created_at: new Date().toISOString(),
  }
  await insertMutation(row)
  if (!onlineManager.isOnline()) return { data: input.optimisticResult, synced: false }

  try {
    const data = await submitMutation<T>(row)
    await deleteMutation(row.id)
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
  const send = () => fetch(`${env.apiBaseUrl}${row.path}`, {
    method: row.method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Idempotency-Key': row.id,
      ...(row.body_json ? { 'Content-Type': 'application/json' } : {}),
    },
    body: row.body_json,
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
        await deleteMutation(row.id)
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
