import AddExpenseBase, { type ConfirmExpenseData } from '@/components/shared/add-expense-base'
import { FILTER_DATA } from './data/mock-data'

interface AddEntryScreenProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AddEntryScreen({ onClose, onSuccess }: AddEntryScreenProps) {
  const handleConfirm = (data: ConfirmExpenseData) => {
    const parsedAmount = data.amount

    // Create a new expense item
    const newExpense = {
      id: Date.now().toString(),
      name: data.description,
      subtitle: 'You paid',
      amount: parsedAmount,
      currency: 'PKR',
      category: (data.category === 'bills'
        ? 'shopping'
        : data.category === 'grocery'
          ? 'shopping'
          : data.category === 'transport'
            ? 'fuel'
            : data.category === 'fuel'
              ? 'fuel'
              : 'other') as any, // maps to allowed tags
    }

    // Add to in-memory datasets
    FILTER_DATA.this_month.expenses.push(newExpense)
    FILTER_DATA.all_time.expenses.push(newExpense)

    // Increment summaries
    FILTER_DATA.this_month.summary.totalSpent += parsedAmount
    FILTER_DATA.all_time.summary.totalSpent += parsedAmount
  }

  return (
    <AddExpenseBase
      title="Add Entry"
      showPaidByAndSplit={false}
      onConfirm={handleConfirm}
      onSuccessComplete={onSuccess}
      onBack={onClose}
    />
  )
}
