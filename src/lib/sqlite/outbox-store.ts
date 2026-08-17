import { getDatabase } from './init'

export type OutboxStatus = 'pending' | 'syncing' | 'synced' | 'failed'

export interface OutboxRow {
  id: string
  idempotency_key: string
  method: string
  payload_json: string
  local_receipt_path: string | null
  status: OutboxStatus
  attempt_count: number
  last_error: string | null
  created_at: string
}

export async function insertOutboxRow(row: {
  id: string
  idempotencyKey: string
  method: string
  payloadJson: string
  localReceiptPath: string | null
  createdAt: string
}): Promise<void> {
  const db = await getDatabase()
  await db.run(
    `INSERT INTO expense_outbox (id, idempotency_key, method, payload_json, local_receipt_path, status, attempt_count, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', 0, ?)`,
    [row.id, row.idempotencyKey, row.method, row.payloadJson, row.localReceiptPath, row.createdAt],
  )
}

/** Oldest-first — see offline-sync.md's "apply queued mutations in the
 * order they were created locally". */
export async function getPendingOutboxRows(): Promise<OutboxRow[]> {
  const db = await getDatabase()
  const result = await db.query(
    `SELECT * FROM expense_outbox WHERE status = 'pending' ORDER BY created_at ASC`,
  )
  return (result.values ?? []) as OutboxRow[]
}

export async function markOutboxRowSyncing(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run(`UPDATE expense_outbox SET status = 'syncing', attempt_count = attempt_count + 1 WHERE id = ?`, [id])
}

export async function markOutboxRowSynced(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run(`DELETE FROM expense_outbox WHERE id = ?`, [id])
}

/** Permanent failure (validation/permission error) — not retried by the
 * drain loop again; distinct from a transient network failure, which
 * instead just reverts the row to 'pending' for the next drain attempt. */
export async function markOutboxRowFailed(id: string, errorMessage: string): Promise<void> {
  const db = await getDatabase()
  await db.run(`UPDATE expense_outbox SET status = 'failed', last_error = ? WHERE id = ?`, [errorMessage, id])
}

export async function markOutboxRowPending(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run(`UPDATE expense_outbox SET status = 'pending' WHERE id = ?`, [id])
}
