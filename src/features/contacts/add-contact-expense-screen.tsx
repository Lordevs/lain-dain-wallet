import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import AddExpenseBase, { type ConfirmExpenseData } from '@/components/shared/add-expense-base'
import { useEnsureFriendship } from '@/features/contacts/hooks/use-ensure-friendship'
import { useCategoriesQuery } from '@/features/contacts/api/use-categories-query'
import { useCreateFriendshipExpenseMutation } from '@/features/contacts/api/use-create-friendship-expense-mutation'
import { useAuthStore } from '@/store/use-auth-store'
import { colorForName, initialsForName } from '@/lib/avatar-visuals'
import { ROUTES } from '@/constants/routes'
import type {
  FriendshipExpensePayer,
  FriendshipExpenseSplit,
} from '@/features/contacts/lib/build-friendship-expense-form-data'

/**
 * The full amount always goes to whichever user_id(s) actually paid —
 * for split_type=equal the backend computes each share itself from just
 * the participant list, so 'equal' splits never carry an amount.
 */
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
  // adjustment
  return ['you', 'contact'].map((m) => ({
    user_id: idFor(m),
    extra_amount: (splitData.adjustmentAmounts[m] ?? 0).toFixed(2),
  }))
}

export default function AddContactExpenseScreen() {
  const { id: userId } = useParams({ from: '/contacts/$id/add-expense' })
  const navigate = useNavigate()
  const userProfile = useAuthStore((s) => s.userProfile)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const ensureFriendship = useEnsureFriendship(userId)
  const categoriesQuery = useCategoriesQuery()
  const createExpense = useCreateFriendshipExpenseMutation()

  if (ensureFriendship.isLoading || categoriesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  if (ensureFriendship.isError || !ensureFriendship.friendship) {
    return (
      <div className="flex items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
        <div className="text-center">
          <p className="text-lg font-bold text-[#1A1A1A]">
            {ensureFriendship.error?.message ?? "Couldn't load this contact"}
          </p>
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

  const otherUser = ensureFriendship.friendship.friend
  const friendshipId = ensureFriendship.friendship.id
  const myId = userProfile?.id ?? ''
  const contactVisuals = {
    id: otherUser.id,
    name: otherUser.full_name,
    initials: initialsForName(otherUser.full_name),
    avatarColor: colorForName(otherUser.full_name),
  }

  const handleConfirm = async (data: ConfirmExpenseData) => {
    setSubmitError(null)
    const paidBy = data.paidBy || 'you'
    const category = categoriesQuery.data?.find((c) => c.icon === data.category)
      ?? categoriesQuery.data?.find((c) => c.icon === 'other')

    if (!category) {
      const message = 'No matching category found.'
      setSubmitError(message)
      throw new Error(message)
    }

    try {
      await createExpense.mutateAsync({
        friendshipId,
        values: {
          description: data.description,
          amount: data.amount.toFixed(2),
          date: data.dateISO,
          categoryId: category.id,
          note: data.noteText,
          receipt: data.receiptFile?.dataUrl,
          splitType: data.splitData?.type ?? 'equal',
          payers: buildPayers(paidBy, data.amount, myId, otherUser.id, data.multiplePayerAmounts),
          splits: buildSplits(data, myId, otherUser.id),
        },
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      throw err
    }
  }

  return (
    <>
      <AddExpenseBase
        title="Add Lain Dain"
        showPaidByAndSplit={true}
        contact={contactVisuals}
        onConfirm={handleConfirm}
        onSuccessComplete={() => {
          navigate({ to: ROUTES.CONTACT_DETAILS, params: { id: userId }, replace: true })
        }}
        onBack={() => window.history.back()}
      />
      {submitError && (
        <div className="fixed bottom-6 left-6 right-6 z-70 bg-white border border-tertiary rounded-2xl p-4 shadow-lg">
          <p className="text-sm font-semibold text-tertiary">{submitError}</p>
        </div>
      )}
    </>
  )
}
