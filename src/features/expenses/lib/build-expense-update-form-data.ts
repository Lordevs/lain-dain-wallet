export interface ExpenseUpdateFormValues {
  description: string
  amount: string
  date: string // YYYY-MM-DD
  categoryId: string
  note?: string
  /** Local data:/blob: URL from the receipt picker, or null to clear it */
  receipt?: string | null
  removeReceipt?: boolean
  splitType: 'equal' | 'unequal' | 'adjustment'
  payers: { user_id: string; amount: string }[]
  splits: ({ user_id: string } | { user_id: string; amount_owed: string } | { user_id: string; extra_amount: string })[]
}

/**
 * PATCH semantics allow any subset of fields, EXCEPT amount/split_type/
 * payers/splits, which must travel all-together-or-not-at-all (see
 * ExpenseUpdateSerializer's docstring) — this always sends all four
 * together with everything else, which is always valid, rather than
 * tracking which fields actually changed.
 */
export async function buildExpenseUpdateFormData(data: ExpenseUpdateFormValues): Promise<FormData> {
  const formData = new FormData()
  for (const [key, value] of expenseUpdateFields(data)) formData.append(key, value)

  if (!data.removeReceipt && data.receipt) {
    const blob = await fetch(data.receipt).then((res) => res.blob())
    formData.append('receipt', blob, 'receipt.jpg')
  }

  return formData
}

export function expenseUpdateFields(data: ExpenseUpdateFormValues): Array<[string, string]> {
  const fields: Array<[string, string]> = [
    ['description', data.description], ['amount', data.amount], ['date', data.date],
    ['category_id', data.categoryId], ['split_type', data.splitType],
    ['payers', JSON.stringify(data.payers)], ['splits', JSON.stringify(data.splits)],
  ]
  if (data.note) fields.push(['note', data.note])
  if (data.removeReceipt) fields.push(['remove_receipt', 'true'])
  return fields
}
