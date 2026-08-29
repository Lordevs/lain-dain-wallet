import { getDatabase } from './init'

export interface MutationOutboxRow {
  id: string
  owner_id: string
  resource: string
  method: string
  path: string
  body_json: string | null
  status: 'pending' | 'syncing' | 'failed'
  attempt_count: number
  last_error: string | null
  created_at: string
}

export async function insertMutation(row: Omit<MutationOutboxRow, 'status' | 'attempt_count' | 'last_error'>): Promise<void> {
  const db = await getDatabase()
  await db.run(
    `INSERT INTO mutation_outbox
      (id, owner_id, resource, method, path, body_json, status, attempt_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?)`,
    [row.id, row.owner_id, row.resource, row.method, row.path, row.body_json, row.created_at],
  )
}

export async function getPendingMutations(ownerId: string): Promise<MutationOutboxRow[]> {
  const db = await getDatabase()
  await db.run(
    `UPDATE mutation_outbox SET status = 'pending'
     WHERE owner_id = ? AND status = 'syncing'`,
    [ownerId],
  )
  const result = await db.query(
    `SELECT * FROM mutation_outbox
     WHERE owner_id = ? AND status = 'pending' ORDER BY created_at, id`,
    [ownerId],
  )
  return (result.values ?? []) as MutationOutboxRow[]
}

export async function setMutationStatus(
  id: string,
  status: 'pending' | 'syncing' | 'failed',
  error: string | null = null,
): Promise<void> {
  const db = await getDatabase()
  await db.run(
    `UPDATE mutation_outbox SET status = ?, last_error = ?,
      attempt_count = attempt_count + CASE WHEN ? = 'syncing' THEN 1 ELSE 0 END
     WHERE id = ?`,
    [status, error, status, id],
  )
}

export async function deleteMutation(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run(`DELETE FROM mutation_outbox WHERE id = ?`, [id])
}

export async function getMutationOutboxSummary(ownerId: string): Promise<{
  pending: number
  failed: number
  failedRejectedDeletes: number
  firstError: string | null
}> {
  const db = await getDatabase()
  const result = await db.query(
    `SELECT
       SUM(CASE WHEN status IN ('pending', 'syncing') THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
       SUM(CASE WHEN status = 'failed'
         AND resource IN ('categories', 'groups') AND method = 'DELETE'
         AND COALESCE(last_error, '') NOT LIKE 'Giving up after repeated attempts%'
       THEN 1 ELSE 0 END) AS failed_rejected_deletes,
       MIN(CASE WHEN status = 'failed' THEN last_error END) AS first_error
     FROM mutation_outbox WHERE owner_id = ?`,
    [ownerId],
  )
  const row = result.values?.[0] ?? {}
  return {
    pending: Number(row.pending ?? 0),
    failed: Number(row.failed ?? 0),
    failedRejectedDeletes: Number(row.failed_rejected_deletes ?? 0),
    firstError: (row.first_error as string | null | undefined) ?? null,
  }
}

/**
 * Clears deletion requests that the server permanently rejected. These
 * rows cannot succeed by being replayed unchanged (for example, while an
 * expense still references the category), so the app abandons them without
 * deleting unrelated failed changes.
 */
export async function discardFailedRejectedDeletes(ownerId: string): Promise<void> {
  const db = await getDatabase()
  await db.run(
    `DELETE FROM mutation_outbox
     WHERE owner_id = ? AND status = 'failed'
       AND resource IN ('categories', 'groups') AND method = 'DELETE'
       AND COALESCE(last_error, '') NOT LIKE 'Giving up after repeated attempts%'`,
    [ownerId],
  )
}

export async function retryFailedMutations(ownerId: string): Promise<void> {
  const db = await getDatabase()
  await db.run(
    `UPDATE mutation_outbox SET status = 'pending', last_error = NULL
     WHERE owner_id = ? AND status = 'failed'`,
    [ownerId],
  )
}
