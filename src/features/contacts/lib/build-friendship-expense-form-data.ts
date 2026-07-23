export interface FriendshipExpensePayer {
  user_id: string
  amount: string
}

export type FriendshipExpenseSplit =
  | { user_id: string }
  | { user_id: string; amount_owed: string }
  | { user_id: string; extra_amount: string }

export interface FriendshipExpenseFormValues {
  description: string
  amount: string
  date: string // YYYY-MM-DD
  categoryId: string
  note?: string
  /** Local data: or blob: URL from the receipt picker — not yet a real file */
  receipt?: string | null
  splitType: 'equal' | 'unequal' | 'adjustment'
  payers: FriendshipExpensePayer[]
  splits: FriendshipExpenseSplit[]
}

/**
 * Converts the add-expense form's UI-shaped data into a multipart
 * FormData body for POST /api/expenses/friendships/{friendship_id}/ —
 * `payers`/`splits` travel as JSON-encoded strings (this is a multipart
 * request, so there's no native nested-array wire format — see
 * ExpenseCreateSerializer's own docstring), and the receipt (if any) is
 * fetched into a real Blob the same way every other local-URL upload in
 * this app is (see build-profile-form-data.ts / build-issue-report-form-data.ts).
 */
export async function buildFriendshipExpenseFormData(data: FriendshipExpenseFormValues): Promise<FormData> {
  const formData = new FormData()
  formData.append('description', data.description)
  formData.append('amount', data.amount)
  formData.append('date', data.date)
  formData.append('category_id', data.categoryId)
  if (data.note) formData.append('note', data.note)
  formData.append('split_type', data.splitType)
  formData.append('payers', JSON.stringify(data.payers))
  formData.append('splits', JSON.stringify(data.splits))

  if (data.receipt) {
    const blob = await fetch(data.receipt).then((res) => res.blob())
    formData.append('receipt', blob, 'receipt.jpg')
  }

  return formData
}
