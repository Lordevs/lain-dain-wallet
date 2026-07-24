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
  formData.append('description', data.description)
  formData.append('amount', data.amount)
  formData.append('date', data.date)
  formData.append('category_id', data.categoryId)
  if (data.note) formData.append('note', data.note)
  formData.append('split_type', data.splitType)
  formData.append('payers', JSON.stringify(data.payers))
  formData.append('splits', JSON.stringify(data.splits))

  if (data.removeReceipt) {
    formData.append('remove_receipt', 'true')
  } else if (data.receipt) {
    const blob = await fetch(data.receipt).then((res) => res.blob())
    formData.append('receipt', blob, 'receipt.jpg')
  }

  return formData
}
