import { getDatabase } from './init'

export type ExpenseSyncStatus = 'pending' | 'syncing' | 'synced' | 'failed'

export interface LocalExpenseInsert {
  id: string
  context: 'personal' | 'friendship' | 'group'
  friendshipId: string | null
  groupId: string | null
  addedById: string
  description: string
  amount: string
  date: string
  categoryId: string
  note: string
  localReceiptPath: string | null
  splitType: string | null
  payersJson: string
  splitsJson: string
  createdAt: string
}

/** Inserted with an empty currency — the backend derives currency
 * server-side and never accepts it from the client (see
 * apps/expenses/models.py's Expense.amount docstring), so there's
 * nothing honest to fill in here until the real create response comes
 * back and setExpenseSynced() resolves it. */
export async function insertLocalExpense(row: LocalExpenseInsert): Promise<void> {
  const db = await getDatabase()
  await db.run(
    `INSERT INTO expenses (
      id, context, friendship_id, group_id, added_by_id, description, amount, currency, date,
      category_id, note, receipt_url, local_receipt_path, split_type, payers_json, splits_json,
      edited_at, created_at, updated_at, is_deleted, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, NULL, ?, ?, ?, ?, NULL, ?, ?, 0, 'pending')`,
    [
      row.id, row.context, row.friendshipId, row.groupId, row.addedById, row.description, row.amount, row.date,
      row.categoryId, row.note, row.localReceiptPath, row.splitType, row.payersJson, row.splitsJson,
      row.createdAt, row.createdAt,
    ],
  )
}

export async function markLocalExpenseSynced(id: string, currency: string, receiptUrl: string | null): Promise<void> {
  const db = await getDatabase()
  await db.run(
    `UPDATE expenses SET sync_status = 'synced', currency = ?, receipt_url = ?, local_receipt_path = NULL, updated_at = ? WHERE id = ?`,
    [currency, receiptUrl, new Date().toISOString(), id],
  )
}

export async function markLocalExpenseFailed(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run(`UPDATE expenses SET sync_status = 'failed', updated_at = ? WHERE id = ?`, [new Date().toISOString(), id])
}
