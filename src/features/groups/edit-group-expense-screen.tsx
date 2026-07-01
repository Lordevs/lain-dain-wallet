import AddExpenseBase, { type ConfirmExpenseData } from '@/components/shared/add-expense-base'
import { MOCK_RECEIVABLES, MOCK_PAYABLES } from '@/features/dashboard/data/mock-data'
import { TRANSACTION_STORE } from '@/features/contacts/data/transaction-store'

interface EditGroupExpenseScreenProps {
  groupId: string
  txId: string
  onClose: () => void
  onSuccess: () => void
}

export default function EditGroupExpenseScreen({ groupId, txId, onClose, onSuccess }: EditGroupExpenseScreenProps) {
  // Find group by id from mock data
  const contact = [...MOCK_RECEIVABLES, ...MOCK_PAYABLES].find((c) => c.id === groupId)

  if (!contact || contact.type !== 'group') {
    return (
      <div className="flex items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
        <div className="text-center">
          <p className="text-lg font-bold text-[#1A1A1A]">Group not found</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-[#0B683A] text-white rounded-full font-bold border-0 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  // Find the transaction record to edit from TRANSACTION_STORE
  const txList = TRANSACTION_STORE[contact.id] || []
  const tx = txList.find((t) => t.id === txId)

  // Prefill data configuration from tx record
  const initialData = {
    amount: tx ? Math.abs(tx.amount).toString() : '',
    description: tx?.name || '',
    category: tx?.category || 'bills',
    dateValue: tx?.dateValue || 'Today',
    paidBy: tx ? (tx.amount > 0 ? 'you' as const : 'contact' as const) : 'you' as const,
    splitData: {
      type: (tx?.splitType || 'equal') as 'equal' | 'unequal' | 'adjustment',
      selectedMembers: ['you', 'contact'],
      unequalAmounts: { you: 0, contact: 0 },
      adjustmentAmounts: { you: 0, contact: 0 },
    }
  }

  const handleConfirm = (data: ConfirmExpenseData) => {
    const parsedAmount = data.amount
    const paidBy = data.paidBy || 'you'
    const splitData = data.splitData || {
      type: 'equal',
      selectedMembers: ['you', 'contact'],
      unequalAmounts: { you: 0, contact: 0 },
      adjustmentAmounts: { you: 0, contact: 0 },
    }

    // Shared Expense logic: calculate split owes amount
    let contactOwesAmount = 0
    if (splitData.type === 'equal') {
      const selectedCount = splitData.selectedMembers.length
      if (selectedCount > 0) {
        const share = parsedAmount / selectedCount
        if (paidBy === 'you') {
          contactOwesAmount = splitData.selectedMembers.includes('contact') ? share : 0
        } else {
          contactOwesAmount = splitData.selectedMembers.includes('you') ? -share : 0
        }
      }
    } else if (splitData.type === 'unequal') {
      if (paidBy === 'you') {
        contactOwesAmount = Number(splitData.unequalAmounts.contact) || 0
      } else {
        contactOwesAmount = -(Number(splitData.unequalAmounts.you) || 0)
      }
    } else if (splitData.type === 'adjustment') {
      const adjYou = Number(splitData.adjustmentAmounts.you) || 0
      const adjContact = Number(splitData.adjustmentAmounts.contact) || 0
      const totalAdjustments = adjYou + adjContact
      const baseSplit = Math.max(0, parsedAmount - totalAdjustments)
      const basePerPerson = Math.round(baseSplit / 2)
      const finalYou = basePerPerson + adjYou
      const finalContact = basePerPerson + adjContact
      if (paidBy === 'you') {
        contactOwesAmount = finalContact
      } else {
        contactOwesAmount = -finalYou
      }
    }

    // Update the transaction in store
    if (tx) {
      // Revert old transaction netAmount change
      contact.netAmount -= tx.amount

      // Update tx fields
      tx.name = data.description || 'Edited Group Expense'
      tx.amount = contactOwesAmount
      tx.category = data.category as any
      tx.subtitle = paidBy === 'you' ? 'You paid' : `${contact.name.split(' ')[0]} paid`
      tx.splitType = splitData.type
      tx.dateValue = data.dateValue

      // Apply new transaction netAmount change
      contact.netAmount += contactOwesAmount

      // Also update matching tag in breakdown list
      const tagIndex = contact.tags.findIndex((t) => t.name === tx.name || t.amount === tx.amount)
      if (tagIndex !== -1) {
        contact.tags[tagIndex] = {
          name: tx.name,
          amount: contactOwesAmount
        }
      }
    }
  }

  return (
    <AddExpenseBase
      title="Edit Group Expense"
      showPaidByAndSplit={true}
      initialData={initialData}
      contact={{
        id: contact.id,
        name: contact.name,
        initials: contact.initials,
        avatarColor: contact.avatarColor,
      }}
      onConfirm={handleConfirm}
      onSuccessComplete={onSuccess}
      onBack={onClose}
    />
  )
}
