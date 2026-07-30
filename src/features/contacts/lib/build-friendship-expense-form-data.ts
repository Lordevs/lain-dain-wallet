import { appendLedgerExpenseFields, type LedgerExpenseCoreValues } from '@/features/expenses/lib/append-ledger-expense-fields'

export type FriendshipExpensePayer = LedgerExpenseCoreValues['payers'][number]
export type FriendshipExpenseSplit = LedgerExpenseCoreValues['splits'][number]

export interface FriendshipExpenseFormValues extends LedgerExpenseCoreValues {
  date: string // YYYY-MM-DD
}

/**
 * Converts the add-expense form's UI-shaped data into a multipart
 * FormData body for POST /api/expenses/friendships/{friendship_id}/ (and,
 * via useCreateGroupExpenseMutation, the group equivalent — same
 * ExpenseCreateSerializer shape either way). The money/payers/splits/
 * receipt fields are shared with group recurring payments too — see
 * appendLedgerExpenseFields.
 */
export async function buildFriendshipExpenseFormData(data: FriendshipExpenseFormValues): Promise<FormData> {
  const formData = new FormData()
  formData.append('date', data.date)
  await appendLedgerExpenseFields(formData, data)
  return formData
}
