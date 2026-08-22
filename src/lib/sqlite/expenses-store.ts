import { getDatabase } from './init'
import type { SQLiteDBConnection } from '@capacitor-community/sqlite'
import type { components } from '@/lib/api/schema'
import { runInTransaction } from './transaction'

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
  ownerId: string
  serverExpense?: components['schemas']['ExpenseRead']
}

/** Inserted with an empty currency — the backend derives currency
 * server-side and never accepts it from the client (see
 * apps/expenses/models.py's Expense.amount docstring), so there's
 * nothing honest to fill in here until the real create response comes
 * back and setExpenseSynced() resolves it. */
export async function insertLocalExpense(row: LocalExpenseInsert, transaction = true): Promise<void> {
  const db = await getDatabase()
  await db.run(
    `INSERT INTO expenses (
      id, context, friendship_id, group_id, added_by_id, description, amount, currency, date,
      category_id, note, receipt_url, local_receipt_path, split_type, payers_json, splits_json,
      edited_at, created_at, updated_at, is_deleted, sync_status, owner_id, server_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, NULL, ?, ?, ?, ?, NULL, ?, ?, 0, 'pending', ?, ?)`,
    [
      row.id, row.context, row.friendshipId, row.groupId, row.addedById, row.description, row.amount, row.date,
      row.categoryId, row.note, row.localReceiptPath, row.splitType, row.payersJson, row.splitsJson,
      row.createdAt, row.createdAt, row.ownerId, row.serverExpense ? JSON.stringify(row.serverExpense) : null,
    ],
    transaction,
  )
}

export async function markLocalExpenseSynced(
  id: string,
  currency: string,
  receiptUrl: string | null,
  serverExpense?: components['schemas']['ExpenseRead'],
): Promise<void> {
  const db = await getDatabase()
  await db.run(
    `UPDATE expenses SET sync_status = 'synced', currency = ?, receipt_url = ?, local_receipt_path = NULL,
      server_json = COALESCE(?, server_json), updated_at = ? WHERE id = ?`,
    [currency, receiptUrl, serverExpense ? JSON.stringify(serverExpense) : null, new Date().toISOString(), id],
  )
}

export async function updateLocalExpenseSnapshot(
  ownerId: string,
  expense: components['schemas']['ExpenseRead'],
): Promise<void> {
  const db = await getDatabase()
  await db.run(
    `UPDATE expenses SET description = ?, amount = ?, date = ?, category_id = ?, note = ?,
       receipt_url = ?, split_type = ?, payers_json = ?, splits_json = ?, server_json = ?,
       sync_status = 'pending', updated_at = ?
     WHERE owner_id = ? AND id = ?`,
    [
      expense.description, expense.amount, expense.date, expense.category.id, expense.note ?? '',
      expense.receipt ?? null, expense.split_type, JSON.stringify(expense.payers),
      JSON.stringify(expense.splits), JSON.stringify(expense), new Date().toISOString(), ownerId, expense.id,
    ],
  )
}

export async function markLocalExpenseDeleted(ownerId: string, id: string): Promise<void> {
  const db = await getDatabase()
  await db.run(
    `UPDATE expenses SET is_deleted = 1, sync_status = 'pending', updated_at = ?
     WHERE owner_id = ? AND id = ?`,
    [new Date().toISOString(), ownerId, id],
  )
}

export async function clearLocalExpenseHistory(
  ownerId: string,
  scope: { context: 'personal' } | { context: 'friendship'; id: string } | { context: 'group'; id: string },
): Promise<void> {
  const db = await getDatabase()
  if (scope.context === 'personal') {
    await db.run(`UPDATE expenses SET is_deleted = 1 WHERE owner_id = ? AND context = 'personal'`, [ownerId])
  } else if (scope.context === 'friendship') {
    await db.run(`UPDATE expenses SET is_deleted = 1 WHERE owner_id = ? AND friendship_id = ?`, [ownerId, scope.id])
  } else {
    await db.run(`UPDATE expenses SET is_deleted = 1 WHERE owner_id = ? AND group_id = ?`, [ownerId, scope.id])
  }
}

export async function updateLocalExpenseReactions(
  ownerId: string,
  id: string,
  reactions: components['schemas']['ReactionRead'][],
): Promise<void> {
  const expense = await getLocalExpense(ownerId, id)
  if (!expense) return
  const db = await getDatabase()
  await db.run(
    `UPDATE expenses SET server_json = ?, updated_at = ? WHERE owner_id = ? AND id = ?`,
    [JSON.stringify({ ...expense, reactions }), new Date().toISOString(), ownerId, id],
  )
}

async function writeServerExpense(
  db: SQLiteDBConnection,
  ownerId: string,
  expense: components['schemas']['ExpenseDelta'],
): Promise<void> {
  await db.run(
    `INSERT INTO expenses (
      id, context, friendship_id, group_id, added_by_id, description, amount, currency, date,
      category_id, note, receipt_url, local_receipt_path, split_type, payers_json, splits_json,
      edited_at, created_at, updated_at, is_deleted, sync_status, owner_id, server_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      context=excluded.context, friendship_id=excluded.friendship_id, group_id=excluded.group_id,
      added_by_id=excluded.added_by_id, description=excluded.description, amount=excluded.amount,
      currency=excluded.currency, date=excluded.date, category_id=excluded.category_id,
      note=excluded.note, receipt_url=excluded.receipt_url, split_type=excluded.split_type,
      payers_json=excluded.payers_json, splits_json=excluded.splits_json, edited_at=excluded.edited_at,
      updated_at=excluded.updated_at, is_deleted=excluded.is_deleted, sync_status='synced',
      owner_id=excluded.owner_id, server_json=excluded.server_json`,
    [
      expense.id, expense.context, expense.friendship ?? null, expense.group ?? null,
      expense.added_by.id, expense.description, expense.amount, expense.currency, expense.date,
      expense.category.id, expense.note ?? '', expense.receipt ?? null, expense.split_type,
      JSON.stringify(expense.payers), JSON.stringify(expense.splits), expense.edited_at ?? null,
      expense.created_at, expense.updated_at, expense.is_deleted ? 1 : 0, ownerId,
      JSON.stringify(expense),
    ],
    false,
  )
}

export async function upsertServerExpense(
  ownerId: string,
  expense: components['schemas']['ExpenseDelta'],
): Promise<void> {
  await upsertServerExpenses(ownerId, [expense])
}

/** Persist one API page atomically and without starting a transaction for
 * every row. This is used by ledger feeds, where concurrent per-row writes
 * previously caused the whole successful API query to reject. */
export async function upsertServerExpenses(
  ownerId: string,
  expenses: components['schemas']['ExpenseDelta'][],
): Promise<void> {
  if (expenses.length === 0) return
  await runInTransaction(async (db) => {
    for (const expense of expenses) await writeServerExpense(db, ownerId, expense)
  })
}

interface StoredExpenseRow { server_json: string | null }

export async function getLocalExpense(ownerId: string, id: string): Promise<components['schemas']['ExpenseRead'] | null> {
  const db = await getDatabase()
  const result = await db.query(
    `SELECT server_json FROM expenses WHERE owner_id = ? AND id = ? AND is_deleted = 0`,
    [ownerId, id],
  )
  const row = result.values?.[0] as StoredExpenseRow | undefined
  return row?.server_json ? JSON.parse(row.server_json) as components['schemas']['ExpenseRead'] : null
}

export async function getLocalExpenses(
  ownerId: string,
  filters: { context?: string; friendshipId?: string; groupId?: string } = {},
): Promise<components['schemas']['ExpenseRead'][]> {
  const clauses = ['owner_id = ?', 'is_deleted = 0', 'server_json IS NOT NULL']
  const values: string[] = [ownerId]
  if (filters.context) { clauses.push('context = ?'); values.push(filters.context) }
  if (filters.friendshipId) { clauses.push('friendship_id = ?'); values.push(filters.friendshipId) }
  if (filters.groupId) { clauses.push('group_id = ?'); values.push(filters.groupId) }
  const db = await getDatabase()
  const result = await db.query(
    `SELECT server_json FROM expenses WHERE ${clauses.join(' AND ')} ORDER BY date DESC, id DESC`,
    values,
  )
  return (result.values ?? []).flatMap((value) => {
    const json = (value as StoredExpenseRow).server_json
    return json ? [JSON.parse(json) as components['schemas']['ExpenseRead']] : []
  })
}

export async function markLocalExpenseFailed(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run(`UPDATE expenses SET sync_status = 'failed', updated_at = ? WHERE id = ?`, [new Date().toISOString(), id])
}
