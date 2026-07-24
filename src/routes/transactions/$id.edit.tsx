import { createFileRoute, useParams } from '@tanstack/react-router'
import EditContactExpenseScreen from '@/features/contacts/edit-contact-expense-screen'
import EditGroupExpenseScreen from '@/features/groups/edit-group-expense-screen'
import EditPersonalExpenseScreen from '@/features/personal/edit-personal-expense-screen'
import { useExpenseQuery } from '@/features/expenses/api/use-expense-query'
import ExpenseFormSkeleton from '@/components/shared/expense-form-skeleton'

/** Dispatches to the right edit form for this expense's own context —
 * personal, friendship, or group each have a different edit UI (see
 * EditPersonalExpenseScreen's docstring for why personal is simpler). */
function EditTransactionRouteComponent() {
  const { id: txId } = useParams({ from: '/transactions/$id/edit' })
  const expenseQuery = useExpenseQuery(txId)

  if (expenseQuery.isLoading) {
    return <ExpenseFormSkeleton />
  }

  const expense = expenseQuery.data
  if (expenseQuery.isError || !expense) {
    return (
      <div className="flex items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
        <div className="text-center">
          <p className="text-lg font-bold text-[#1A1A1A]">Expense not found</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-positive text-white rounded-full font-bold border-0 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  if (expense.context === 'personal') {
    return <EditPersonalExpenseScreen expense={expense} />
  }
  if (expense.context === 'group') {
    return <EditGroupExpenseScreen />
  }
  return <EditContactExpenseScreen />
}

export const Route = createFileRoute('/transactions/$id/edit')({
  component: EditTransactionRouteComponent,
})
