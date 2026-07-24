import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import AddExpenseBase, { type ConfirmExpenseData } from '@/components/shared/add-expense-base'
import { useCategoriesQuery } from '@/features/expenses/api/use-categories-query'
import { useCreatePersonalExpenseMutation } from '@/features/expenses/api/use-create-personal-expense-mutation'

export default function AddEntryScreen() {
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!submitError) return
    const timer = setTimeout(() => setSubmitError(null), 5000)
    return () => clearTimeout(timer)
  }, [submitError])

  const categoriesQuery = useCategoriesQuery()
  const createExpense = useCreatePersonalExpenseMutation()

  const handleConfirm = async (data: ConfirmExpenseData) => {
    setSubmitError(null)
    const category = categoriesQuery.data?.find((c) => c.icon === data.category)
      ?? categoriesQuery.data?.find((c) => c.icon === 'other')

    if (!category) {
      const message = 'No matching category found.'
      setSubmitError(message)
      throw new Error(message)
    }

    try {
      await createExpense.mutateAsync({
        description: data.description,
        amount: data.amount.toFixed(2),
        date: data.dateISO,
        categoryId: category.id,
        note: data.noteText,
        receipt: data.receiptFile?.dataUrl,
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      throw err
    }
  }

  return (
    <>
      <AddExpenseBase
        title="Add Entry"
        showPaidByAndSplit={false}
        onConfirm={handleConfirm}
        onSuccessComplete={() => window.history.back()}
        onBack={() => window.history.back()}
      />
      {submitError && (
        <div className="fixed bottom-6 left-6 right-6 z-70 bg-white border border-tertiary rounded-2xl p-4 shadow-lg flex items-start gap-3">
          <p className="text-sm font-semibold text-tertiary flex-1">{submitError}</p>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="text-tertiary shrink-0 bg-transparent border-0 cursor-pointer p-0.5"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  )
}
