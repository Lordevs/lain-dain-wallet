import { useParams } from '@tanstack/react-router'
import { toast } from 'sonner'
import AddExpenseBase, { type ConfirmExpenseData } from '@/components/shared/add-expense-base'
import ExpenseFormSkeleton from '@/components/shared/expense-form-skeleton'
import { useGroupQuery } from '@/features/groups/api/use-group-query'
import { useCreateGroupExpenseMutation } from '@/features/groups/api/use-create-group-expense-mutation'
import { useCategoriesQuery } from '@/features/expenses/api/use-categories-query'
import { useAuthStore } from '@/store/use-auth-store'
import { initialsForName, colorForName } from '@/lib/avatar-visuals'
import type {
  FriendshipExpensePayer as LedgerExpensePayer,
  FriendshipExpenseSplit as LedgerExpenseSplit,
} from '@/features/contacts/lib/build-friendship-expense-form-data'

/** Every member id already IS the real backend user_id — unlike the 1:1
 * screens there's no 'you'/'contact' placeholder remapping needed here. */
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

export default function AddGroupExpenseScreen() {
  const { id: groupId } = useParams({ from: '/groups/$id/add-expense' })
  const userProfile = useAuthStore((s) => s.userProfile)
  const myId = userProfile?.id ?? ''

  const groupQuery = useGroupQuery(groupId)
  const categoriesQuery = useCategoriesQuery()
  const createExpense = useCreateGroupExpenseMutation()

  if (groupQuery.isLoading || categoriesQuery.isLoading) {
    return <ExpenseFormSkeleton />
  }

  const group = groupQuery.data
  if (groupQuery.isError || !group) {
    return (
      <div className="flex items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
        <div className="text-center">
          <p className="text-lg font-bold text-[#1A1A1A]">Group not found</p>
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

  const handleConfirm = async (data: ConfirmExpenseData) => {
    const paidBy = data.paidBy || myId
    const category = categoriesQuery.data?.find((c) => c.id === data.category)
      ?? categoriesQuery.data?.find((c) => c.icon === data.category)
      ?? categoriesQuery.data?.find((c) => c.icon === 'other')

    if (!category) {
      const message = 'No matching category found.'
      toast.error(message)
      throw new Error(message)
    }

    try {
      const result = await createExpense.mutateAsync({
        groupId,
        values: {
          description: data.description,
          amount: data.amount.toFixed(2),
          date: data.dateISO,
          categoryId: category.id,
          note: data.noteText,
          receipt: data.receiptFile?.dataUrl,
          splitType: data.splitData?.type ?? 'equal',
          payers: buildPayers(paidBy, data.amount, data.multiplePayerAmounts),
          splits: buildSplits(data),
        },
      })
      if (!result.synced) toast.success("Saved — we'll sync it once you're back online")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      throw err
    }
  }

  return (
    <AddExpenseBase
      title="Add Group Expense"
      showPaidByAndSplit={true}
      currency={group.default_currency}
      members={members}
      onConfirm={handleConfirm}
      // Pop the form instead of replacing it with another copy of the group
      // detail route. Replacing produced two consecutive group-detail entries,
      // making the first Back press appear to do nothing on some devices.
      onSuccessComplete={() => window.history.back()}
      onBack={() => window.history.back()}
    />
  )
}
