import { toast } from 'sonner'
import type { components } from '@/lib/api/schema'
import AddExpenseBase, { type ConfirmExpenseData, type InitialExpenseData } from '@/components/shared/add-expense-base'
import { useUpdatePersonalExpenseMutation } from '@/features/expenses/api/use-update-personal-expense-mutation'
import { useCategoriesQuery } from '@/features/expenses/api/use-categories-query'

type ExpenseRead = components['schemas']['ExpenseRead']

function receiptFileName(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() || 'Receipt')
  } catch {
    return 'Receipt'
  }
}

/** Edit form for a PERSONAL-context expense — no paid-by/split UI, since
 * a personal expense is always "you paid, you owe everything" (see
 * PersonalExpenseCreateSerializer's docstring). Rendered by the shared
 * /transactions/$id/edit route once it's confirmed the expense's own
 * context is personal — see routes/transactions/$id.edit.tsx. */
export default function EditPersonalExpenseScreen({ expense }: { expense: ExpenseRead }) {
  const categoriesQuery = useCategoriesQuery()
  const updateExpense = useUpdatePersonalExpenseMutation()

  const initialData: InitialExpenseData = {
    amount: expense.amount,
    description: expense.description,
    category: expense.category.icon,
    dateValue: new Date(expense.date + 'T00:00:00').toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    dateISO: expense.date,
    noteText: expense.note ?? '',
    receiptFile: expense.receipt
      ? { name: receiptFileName(expense.receipt), size: '', dataUrl: expense.receipt }
      : null,
  }

  const handleConfirm = async (data: ConfirmExpenseData) => {
    const category = categoriesQuery.data?.find((c) => c.icon === data.category)
      ?? categoriesQuery.data?.find((c) => c.icon === 'other')

    if (!category) {
      const message = 'No matching category found.'
      toast.error(message)
      throw new Error(message)
    }

    // Same "only touch the receipt if the user actually changed it" rule
    // as the friendship edit screen — see edit-contact-expense-screen.tsx.
    const receiptChanged = data.receiptTouched && data.receiptFile?.dataUrl !== expense.receipt
    const receiptCleared = data.receiptTouched && !data.receiptFile

    try {
      await updateExpense.mutateAsync({
        id: expense.id,
        values: {
          description: data.description,
          amount: data.amount.toFixed(2),
          date: data.dateISO,
          categoryId: category.id,
          note: data.noteText,
          receipt: receiptChanged && !receiptCleared ? data.receiptFile?.dataUrl : undefined,
          removeReceipt: receiptCleared,
        },
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      throw err
    }
  }

  return (
    <AddExpenseBase
      title="Edit Entry"
      showPaidByAndSplit={false}
      initialData={initialData}
      onConfirm={handleConfirm}
      onSuccessComplete={() => window.history.back()}
      onBack={() => window.history.back()}
    />
  )
}
