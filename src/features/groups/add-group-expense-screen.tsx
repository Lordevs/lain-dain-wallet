import { useState } from 'react'
import AddExpenseBase, { type ConfirmExpenseData } from '@/components/shared/add-expense-base'
import { MOCK_RECEIVABLES, MOCK_PAYABLES } from '@/features/dashboard/data/mock-data'
import { TRANSACTION_STORE } from '@/features/contacts/data/transaction-store'
import { calculateContactOwesAmount } from '@/lib/split'

interface AddGroupExpenseScreenProps {
  groupId: string
  onClose: () => void
  onSuccess: (newTxId: string) => void
}

export default function AddGroupExpenseScreen({ groupId, onClose, onSuccess }: AddGroupExpenseScreenProps) {

  const [newTxId, setNewTxId] = useState<string | null>(null)

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


  const handleConfirm = (data: ConfirmExpenseData) => {
    const parsedAmount = data.amount
    const paidBy = data.paidBy || 'you'
    const splitData = data.splitData || {
      type: 'equal',
      selectedMembers: ['you', 'contact'],
      unequalAmounts: { you: 0, contact: 0 },
      adjustmentAmounts: { you: 0, contact: 0 },
    }

    const contactOwesAmount = calculateContactOwesAmount(parsedAmount, paidBy as 'you' | 'contact', splitData)

    // Add to group's tags breakdown history
    const newTag = {
      name: data.description || 'New Group Expense',
      amount: contactOwesAmount,
    }
    contact.tags.push(newTag)
    contact.netAmount += contactOwesAmount
    contact.ledgerCount = contact.tags.length

    // Add to TRANSACTION_STORE
    if (!TRANSACTION_STORE[contact.id]) {
      TRANSACTION_STORE[contact.id] = []
    }
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const generatedId = 'tx-' + Date.now()
    TRANSACTION_STORE[contact.id].push({
      id: generatedId,
      name: data.description || 'New Group Expense',
      subtitle: paidBy === 'you' ? 'You paid' : `${contact.name.split(' ')[0]} paid`,
      amount: contactOwesAmount,
      category: data.category as any,
      rightSubtitle: `Today, ${timeStr}`,
      splitType: splitData.type,
      dateValue: data.dateValue
    })

    setNewTxId(generatedId)
  }

  return (
    <AddExpenseBase
      title="Add Group Expense"
      showPaidByAndSplit={true}
      contact={{
        id: contact.id,
        name: contact.name,
        initials: contact.initials,
        avatarColor: contact.avatarColor,
      }}
      onConfirm={handleConfirm}
      onSuccessComplete={() => {
        if (newTxId) {
          onSuccess(newTxId)
        } else {
          onClose()
        }
      }}
      onBack={onClose}
    />
  )
}
