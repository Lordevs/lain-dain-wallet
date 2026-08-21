export interface LedgerExpenseCoreValues {
  description: string
  amount: string
  categoryId: string
  note?: string
  /** Local data:/blob: URL from the receipt picker — not yet a real file */
  receipt?: string | null
  splitType: 'equal' | 'unequal' | 'adjustment'
  payers: { user_id: string; amount: string }[]
  splits: ({ user_id: string } | { user_id: string; amount_owed: string } | { user_id: string; extra_amount: string })[]
}

export function ledgerExpenseFields(data: LedgerExpenseCoreValues): Array<[string, string]> {
  const fields: Array<[string, string]> = [
    ['description', data.description],
    ['amount', data.amount],
    ['category_id', data.categoryId],
    ['split_type', data.splitType],
    ['payers', JSON.stringify(data.payers)],
    ['splits', JSON.stringify(data.splits)],
  ]
  if (data.note) fields.push(['note', data.note])
  return fields
}

/**
 * Appends the fields shared by every "money + payers/splits" multipart
 * form — friendship/group expense create, group recurring payment
 * create/update — to a FormData in place. `payers`/`splits` travel as
 * JSON-encoded strings (multipart has no native nested-array wire
 * format), and a local data:/blob: URL receipt is fetched into a real
 * Blob before upload. Callers append their own scope-specific fields
 * (date, frequency, start_date, ...) separately, since those differ
 * between an expense (single `date`) and a recurring payment
 * (`start_date`/`next_occurrence`).
 */
export async function appendLedgerExpenseFields(formData: FormData, data: LedgerExpenseCoreValues): Promise<void> {
  for (const [key, value] of ledgerExpenseFields(data)) formData.append(key, value)

  if (data.receipt) {
    const blob = await fetch(data.receipt).then((res) => res.blob())
    formData.append('receipt', blob, 'receipt.jpg')
  }
}
