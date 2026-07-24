export interface PersonalExpenseFormValues {
  description: string
  amount: string
  date: string // YYYY-MM-DD
  categoryId: string
  note?: string
  /** Local data:/blob: URL from the receipt picker — not yet a real file */
  receipt?: string | null
}

/**
 * Converts the add-expense form's UI-shaped data into a multipart
 * FormData body for POST /api/expenses/personal/ — deliberately no
 * payers/splits/split_type field: the backend hard-wires personal
 * expenses to "actor paid, actor owes everything" and rejects those
 * fields outright if sent (see PersonalExpenseCreateSerializer).
 */
export async function buildPersonalExpenseFormData(data: PersonalExpenseFormValues): Promise<FormData> {
  const formData = new FormData()
  formData.append('description', data.description)
  formData.append('amount', data.amount)
  formData.append('date', data.date)
  formData.append('category_id', data.categoryId)
  if (data.note) formData.append('note', data.note)

  if (data.receipt) {
    const blob = await fetch(data.receipt).then((res) => res.blob())
    formData.append('receipt', blob, 'receipt.jpg')
  }

  return formData
}
