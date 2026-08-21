import { getDatabase } from './init'
import { runInTransaction } from './transaction'

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
  owner_id: string
}

export async function insertOutboxRow(row: {
  id: string
  idempotencyKey: string
  method: string
  payloadJson: string
  localReceiptPath: string | null
  createdAt: string
  ownerId: string
}): Promise<void> {
  const db = await getDatabase()
  await db.run(
    `INSERT INTO expense_outbox (id, idempotency_key, method, payload_json, local_receipt_path, status, attempt_count, created_at, owner_id)
     VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
    [row.id, row.idempotencyKey, row.method, row.payloadJson, row.localReceiptPath, row.createdAt, row.ownerId],
  )
}

/** Oldest-first — see offline-sync.md's "apply queued mutations in the
 * order they were created locally". */
export async function getPendingOutboxRows(ownerId: string): Promise<OutboxRow[]> {
  const db = await getDatabase()
  const result = await db.query(
    `SELECT * FROM expense_outbox WHERE owner_id = ? AND status = 'pending' ORDER BY created_at ASC`,
    [ownerId],
  )
  return (result.values ?? []) as OutboxRow[]
}

/** A process can die after marking a row syncing but before receiving a
 * response. Idempotency makes replay safe, so every new drain recovers it. */
export async function recoverInterruptedOutboxRows(ownerId: string): Promise<void> {
  const db = await getDatabase()
  // Version-1 rows had no owner column. The backend permits one active
  // device session per account, so the first restored session after the
  // upgrade is the only safe owner and no queued work has to be discarded.
  await db.run(`UPDATE expense_outbox SET owner_id = ? WHERE owner_id = ''`, [ownerId])
  await db.run(`UPDATE expenses SET owner_id = ? WHERE owner_id = ''`, [ownerId])
  await db.run(
    `UPDATE expense_outbox SET status = 'pending' WHERE owner_id = ? AND status = 'syncing'`,
    [ownerId],
  )
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

export interface OutboxSummary {
  pending: number
  failed: number
  firstError: string | null
}

export async function getExpenseOutboxSummary(ownerId: string): Promise<OutboxSummary> {
  const db = await getDatabase()
  const result = await db.query(
    `SELECT
       SUM(CASE WHEN status IN ('pending', 'syncing') THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
       MIN(CASE WHEN status = 'failed' THEN last_error END) AS first_error
     FROM expense_outbox WHERE owner_id = ?`,
    [ownerId],
  )
  const row = result.values?.[0] ?? {}
  return {
    pending: Number(row.pending ?? 0),
    failed: Number(row.failed ?? 0),
    firstError: (row.first_error as string | null | undefined) ?? null,
  }
}

export async function retryFailedExpenseRows(ownerId: string): Promise<void> {
  await runInTransaction(async (db) => {
    await db.run(
      `UPDATE expense_outbox SET status = 'pending', last_error = NULL
       WHERE owner_id = ? AND status = 'failed'`,
      [ownerId],
    )
    await db.run(
      `UPDATE expenses SET sync_status = 'pending'
       WHERE owner_id = ? AND id IN (
         SELECT id FROM expense_outbox WHERE owner_id = ? AND status = 'pending'
       )`,
      [ownerId, ownerId],
    )
  })
}
