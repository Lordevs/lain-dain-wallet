import { useParams } from '@tanstack/react-router'
import { toast } from 'sonner'
import AddExpenseBase, { type ConfirmExpenseData, type InitialExpenseData } from '@/components/shared/add-expense-base'
import ExpenseFormSkeleton from '@/components/shared/expense-form-skeleton'
import { useExpenseQuery } from '@/features/expenses/api/use-expense-query'
import { useUpdateExpenseMutation } from '@/features/expenses/api/use-update-expense-mutation'
import { useCategoriesQuery } from '@/features/expenses/api/use-categories-query'
import { useGroupQuery } from '@/features/groups/api/use-group-query'
import { useAuthStore } from '@/store/use-auth-store'
import { initialsForName, colorForName } from '@/lib/avatar-visuals'
import type {
  FriendshipExpensePayer as LedgerExpensePayer,
  FriendshipExpenseSplit as LedgerExpenseSplit,
} from '@/features/contacts/lib/build-friendship-expense-form-data'

function receiptFileName(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() || 'Receipt')
  } catch {
    return 'Receipt'
  }
}

function buildPayers(
  paidBy: string,
  amount: number,
  multipleAmounts: Record<string, number> | undefined,
): LedgerExpensePayer[] {
  if (paidBy === 'multiple' && multipleAmounts) {
    const payers = Object.entries(multipleAmounts)
      .filter(([, amt]) => amt > 0)
      .map(([userId, amt]) => ({ user_id: userId, amount: amt.toFixed(2) }))
    return payers.length > 0 ? payers : [{ user_id: paidBy, amount: amount.toFixed(2) }]
  }
  return [{ user_id: paidBy, amount: amount.toFixed(2) }]
}

function buildSplits(data: ConfirmExpenseData): LedgerExpenseSplit[] {
  const splitData = data.splitData
  if (!splitData || splitData.type === 'equal') {
    const members = splitData?.selectedMembers ?? []
    return members.map((id) => ({ user_id: id }))
  }
  if (splitData.type === 'unequal') {
    return Object.entries(splitData.unequalAmounts).map(([id, amt]) => ({
      user_id: id,
      amount_owed: amt.toFixed(2),
    }))
  }
  return Object.entries(splitData.adjustmentAmounts).map(([id, amt]) => ({
    user_id: id,
    extra_amount: amt.toFixed(2),
  }))
}

/** Edit form for a group expense — reached only via the shared
 * /transactions/$id/edit dispatcher, which already confirmed
 * expense.context === 'group' before rendering this. */
export default function EditGroupExpenseScreen() {
  const { id: txId } = useParams({ from: '/transactions/$id/edit' })
  const userProfile = useAuthStore((s) => s.userProfile)
  const myId = userProfile?.id ?? ''

  const expenseQuery = useExpenseQuery(txId)
  const groupQuery = useGroupQuery(expenseQuery.data?.group ?? undefined)
  const updateExpense = useUpdateExpenseMutation()
  const categoriesQuery = useCategoriesQuery()

  if (expenseQuery.isLoading || (!!expenseQuery.data?.group && groupQuery.isLoading)) {
    return <ExpenseFormSkeleton />
  }

  const expense = expenseQuery.data
  const group = groupQuery.data

  if (expenseQuery.isError || !expense || !group) {
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

  // Every entry in group.members is already an active membership — adds
  // are immediate now, no more pending/invited members to filter out.
  const orderedMembers = [...group.members].sort((a, b) => (a.id === myId ? -1 : b.id === myId ? 1 : 0))
  const members = orderedMembers.map((m) => ({
    id: m.id,
    name: m.id === myId ? 'You' : m.full_name,
    initials: initialsForName(m.full_name),
    avatarColor: colorForName(m.full_name),
  }))

  const paidBy: string = expense.payers.length > 1 ? 'multiple' : (expense.payers[0]?.id ?? myId)

  const multiplePayerAmounts =
    expense.payers.length > 1
      ? Object.fromEntries(expense.payers.map((p) => [p.id, Number(p.amount)]))
      : undefined

  const splitData = {
    type: expense.split_type,
    selectedMembers: expense.splits.map((s) => s.id),
    unequalAmounts: Object.fromEntries(expense.splits.map((s) => [s.id, Number(s.amount_owed)])),
    adjustmentAmounts: Object.fromEntries(expense.splits.map((s) => [s.id, Number(s.extra_amount)])),
  }

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
    paidBy,
    multiplePayerAmounts,
    splitData,
  }

  const handleConfirm = async (data: ConfirmExpenseData) => {
    const paidByValue = data.paidBy || myId
    const category = categoriesQuery.data?.find((c) => c.icon === data.category)
      ?? categoriesQuery.data?.find((c) => c.icon === 'other')

    if (!category) {
      const message = 'No matching category found.'
      toast.error(message)
      throw new Error(message)
    }

    const receiptChanged = data.receiptTouched && data.receiptFile?.dataUrl !== expense.receipt
    const receiptCleared = data.receiptTouched && !data.receiptFile

    try {
      await updateExpense.mutateAsync({
        id: expense.id,
        groupId: expense.group ?? undefined,
        values: {
          description: data.description,
          amount: data.amount.toFixed(2),
          date: data.dateISO,
          categoryId: category.id,
          note: data.noteText,
          receipt: receiptChanged && !receiptCleared ? data.receiptFile?.dataUrl : undefined,
          removeReceipt: receiptCleared,
          splitType: data.splitData?.type ?? 'equal',
          payers: buildPayers(paidByValue, data.amount, data.multiplePayerAmounts),
          splits: buildSplits(data),
        },
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      throw err
    }
  }

  return (
    <AddExpenseBase
      title="Edit Expense"
      showPaidByAndSplit={true}
      members={members}
      initialData={initialData}
      onConfirm={handleConfirm}
      onSuccessComplete={() => window.history.back()}
      onBack={() => window.history.back()}
    />
  )
}
