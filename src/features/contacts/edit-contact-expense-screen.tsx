import { useParams, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import AddExpenseBase, { type ConfirmExpenseData, type InitialExpenseData } from '@/components/shared/add-expense-base'
import ExpenseFormSkeleton from '@/components/shared/expense-form-skeleton'
import { useExpenseQuery } from '@/features/expenses/api/use-expense-query'
import { useUpdateExpenseMutation } from '@/features/expenses/api/use-update-expense-mutation'
import { useCategoriesQuery } from '@/features/expenses/api/use-categories-query'
import { useAuthStore } from '@/store/use-auth-store'
import { colorForName, initialsForName } from '@/lib/avatar-visuals'
import { ROUTES } from '@/constants/routes'
import type {
  FriendshipExpensePayer,
  FriendshipExpenseSplit,
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
  myId: string,
  otherId: string,
  multipleAmounts: Record<string, number> | undefined,
): FriendshipExpensePayer[] {
  if (paidBy === 'multiple' && multipleAmounts) {
    const payers: FriendshipExpensePayer[] = []
    if ((multipleAmounts.you ?? 0) > 0) payers.push({ user_id: myId, amount: multipleAmounts.you.toFixed(2) })
    if ((multipleAmounts.contact ?? 0) > 0) payers.push({ user_id: otherId, amount: multipleAmounts.contact.toFixed(2) })
    return payers.length > 0 ? payers : [{ user_id: myId, amount: amount.toFixed(2) }]
  }
  const payerId = paidBy === 'contact' ? otherId : myId
  return [{ user_id: payerId, amount: amount.toFixed(2) }]
}

function buildSplits(data: ConfirmExpenseData, myId: string, otherId: string): FriendshipExpenseSplit[] {
  const idFor = (localId: string) => (localId === 'contact' ? otherId : myId)
  const splitData = data.splitData
  if (!splitData || splitData.type === 'equal') {
    const members = splitData?.selectedMembers ?? ['you', 'contact']
    return members.map((m) => ({ user_id: idFor(m) }))
  }
  if (splitData.type === 'unequal') {
    return ['you', 'contact'].map((m) => ({
      user_id: idFor(m),
      amount_owed: (splitData.unequalAmounts[m] ?? 0).toFixed(2),
    }))
  }
  return ['you', 'contact'].map((m) => ({
    user_id: idFor(m),
    extra_amount: (splitData.adjustmentAmounts[m] ?? 0).toFixed(2),
  }))
}

export default function EditContactExpenseScreen() {
  const { id: txId } = useParams({ from: '/transactions/$id/edit' })
  const navigate = useNavigate()
  const userProfile = useAuthStore((s) => s.userProfile)
  const myId = userProfile?.id ?? ''

  const expenseQuery = useExpenseQuery(txId)
  const updateExpense = useUpdateExpenseMutation()
  const categoriesQuery = useCategoriesQuery()

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

  const otherParticipant = [...expense.payers, ...expense.splits].find((p) => p.id !== myId)
  if (!otherParticipant) {
    return (
      <div className="flex items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
        <div className="text-center">
          <p className="text-lg font-bold text-[#1A1A1A]">Couldn't determine the other participant</p>
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

  const contactVisuals = {
    id: otherParticipant.id,
    name: otherParticipant.full_name,
    initials: initialsForName(otherParticipant.full_name),
    avatarColor: colorForName(otherParticipant.full_name),
  }

  const isPayer = (id: string) => expense.payers.some((p) => p.id === id)
  const paidBy: string =
    expense.payers.length > 1
      ? 'multiple'
      : isPayer(myId)
        ? 'you'
        : 'contact'

  const multiplePayerAmounts =
    expense.payers.length > 1
      ? Object.fromEntries(
          expense.payers.map((p) => [p.id === myId ? 'you' : 'contact', Number(p.amount)]),
        )
      : undefined

  const idToLocal = (id: string) => (id === myId ? 'you' : 'contact')

  const splitData =
    expense.split_type === 'unequal'
      ? {
          type: 'unequal' as const,
          selectedMembers: expense.splits.map((s) => idToLocal(s.id)),
          unequalAmounts: Object.fromEntries(expense.splits.map((s) => [idToLocal(s.id), Number(s.amount_owed)])),
          adjustmentAmounts: { you: 0, contact: 0 },
        }
      : expense.split_type === 'adjustment'
        ? {
            type: 'adjustment' as const,
            selectedMembers: expense.splits.map((s) => idToLocal(s.id)),
            unequalAmounts: { you: 0, contact: 0 },
            adjustmentAmounts: Object.fromEntries(expense.splits.map((s) => [idToLocal(s.id), Number(s.extra_amount)])),
          }
        : {
            type: 'equal' as const,
            selectedMembers: expense.splits.map((s) => idToLocal(s.id)),
            unequalAmounts: { you: 0, contact: 0 },
            adjustmentAmounts: { you: 0, contact: 0 },
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
    const paidByValue = data.paidBy || 'you'
    const category = categoriesQuery.data?.find((c) => c.icon === data.category)
      ?? categoriesQuery.data?.find((c) => c.icon === 'other')

    if (!category) {
      const message = 'No matching category found.'
      toast.error(message)
      throw new Error(message)
    }

    // Only touch the receipt at all if the user actually opened the picker
    // and changed something — otherwise omit both fields so the existing
    // receipt (if any) is left alone instead of being silently deleted, and
    // we never try to refetch/re-upload the already-uploaded file.
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
          splitType: data.splitData?.type ?? 'equal',
          payers: buildPayers(paidByValue, data.amount, myId, otherParticipant.id, data.multiplePayerAmounts),
          splits: buildSplits(data, myId, otherParticipant.id),
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
      contact={contactVisuals}
      initialData={initialData}
      onConfirm={handleConfirm}
      onSuccessComplete={() => {
        navigate({
          to: ROUTES.TRANSACTION_DETAILS,
          params: { id: expense.id },
          replace: true,
        })
      }}
      onBack={() => window.history.back()}
    />
  )
}
