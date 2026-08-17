import { toast } from 'sonner'
import AddExpenseBase, { type ConfirmExpenseData } from '@/components/shared/add-expense-base'
import { useCategoriesQuery } from '@/features/expenses/api/use-categories-query'
import { useCreatePersonalExpenseMutation } from '@/features/expenses/api/use-create-personal-expense-mutation'

export default function AddEntryScreen() {
  const categoriesQuery = useCategoriesQuery()
  const createExpense = useCreatePersonalExpenseMutation()

  const handleConfirm = async (data: ConfirmExpenseData) => {
    const category = categoriesQuery.data?.find((c) => c.icon === data.category)
      ?? categoriesQuery.data?.find((c) => c.icon === 'other')

    if (!category) {
      const message = 'No matching category found.'
      toast.error(message)
      throw new Error(message)
    }

    try {
      const result = await createExpense.mutateAsync({
        description: data.description,
        amount: data.amount.toFixed(2),
        date: data.dateISO,
        categoryId: category.id,
        note: data.noteText,
        receipt: data.receiptFile?.dataUrl,
      })
      if (!result.synced) toast.success("Saved — we'll sync it once you're back online")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      throw err
    }
  }

  return (
    <AddExpenseBase
      title="Add Entry"
      showPaidByAndSplit={false}
      onConfirm={handleConfirm}
      onSuccessComplete={() => window.history.back()}
      onBack={() => window.history.back()}
    />
  )
}
