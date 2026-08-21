export interface PersonalExpenseUpdateFormValues {
  description: string
  amount: string
  date: string // YYYY-MM-DD
  categoryId: string
  note?: string
  /** Local data:/blob: URL from the receipt picker, or null to clear it */
  receipt?: string | null
  removeReceipt?: boolean
}

/**
 * PATCH semantics for a personal expense: unlike a friendship/group
 * expense, `amount` alone is enough to touch the money side — split_type/
 * payers/splits don't apply to a personal expense and the backend
 * rejects them outright if sent (see ExpenseUpdateSerializer's docstring
 * and services.update_expense/_resolve_money) — so this builder never
 * appends them, unlike build-expense-update-form-data.ts's friendship
 * equivalent.
 */
export async function buildPersonalExpenseUpdateFormData(data: PersonalExpenseUpdateFormValues): Promise<FormData> {
  const formData = new FormData()
  for (const [key, value] of personalExpenseUpdateFields(data)) formData.append(key, value)

  if (!data.removeReceipt && data.receipt) {
    const blob = await fetch(data.receipt).then((res) => res.blob())
    formData.append('receipt', blob, 'receipt.jpg')
  }

  return formData
}

export function personalExpenseUpdateFields(data: PersonalExpenseUpdateFormValues): Array<[string, string]> {
  const fields: Array<[string, string]> = [
    ['description', data.description], ['amount', data.amount], ['date', data.date],
    ['category_id', data.categoryId],
  ]
  if (data.note) fields.push(['note', data.note])
  if (data.removeReceipt) fields.push(['remove_receipt', 'true'])
  return fields
}
