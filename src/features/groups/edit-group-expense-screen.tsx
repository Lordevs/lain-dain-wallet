import AddExpenseBase, { type ConfirmExpenseData } from '@/components/shared/add-expense-base'
import { MOCK_RECEIVABLES, MOCK_PAYABLES } from '@/features/dashboard/data/mock-data'
import { TRANSACTION_STORE } from '@/features/contacts/data/transaction-store'
import { calculateContactOwesAmount } from '@/lib/split'

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

    const contactOwesAmount = calculateContactOwesAmount(parsedAmount, paidBy as 'you' | 'contact', splitData)

    // Update the transaction in store
    const txIndex = txList.findIndex((t) => t.id === txId)
    if (txIndex !== -1) {
      const oldTx = txList[txIndex]
      const oldAmount = oldTx.amount
      const oldName = oldTx.name

      // Replace record without mutating — preserves old values for tag lookup below
      txList[txIndex] = {
        ...oldTx,
        name: data.description || 'Edited Group Expense',
        amount: contactOwesAmount,
        category: data.category as any,
        subtitle: paidBy === 'you' ? 'You paid' : `${contact.name.split(' ')[0]} paid`,
        splitType: splitData.type,
        dateValue: data.dateValue,
      }

      // Diff-based netAmount update avoids double-apply on repeated edits
      contact.netAmount += contactOwesAmount - oldAmount

      // Use original name/amount to locate the tag before it was changed
      const tagIndex = contact.tags.findIndex((t) => t.name === oldName || t.amount === oldAmount)
      if (tagIndex !== -1) {
        contact.tags[tagIndex] = {
          name: data.description || 'Edited Group Expense',
          amount: contactOwesAmount,
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
