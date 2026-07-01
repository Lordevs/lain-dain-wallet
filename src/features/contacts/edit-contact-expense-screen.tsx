import AddExpenseBase, { type ConfirmExpenseData } from '@/components/shared/add-expense-base'
import { MOCK_RECEIVABLES, MOCK_PAYABLES } from '@/features/dashboard/data/mock-data'
import { TRANSACTION_STORE } from '@/features/contacts/data/transaction-store'
import { calculateContactOwesAmount } from '@/lib/split'

interface EditContactExpenseScreenProps {
  contactId: string
  txId: string
  onClose: () => void
  onSuccess: () => void
}

export default function EditContactExpenseScreen({ contactId, txId, onClose, onSuccess }: EditContactExpenseScreenProps) {
  // Find contact by id from mock data
  const contact = [...MOCK_RECEIVABLES, ...MOCK_PAYABLES].find((c) => c.id === contactId)

  if (!contact) {
    return (
      <div className="flex items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
        <div className="text-center">
          <p className="text-lg font-bold text-[#1A1A1A]">Contact not found</p>
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

    // Update store
    const txIndex = txList.findIndex((t) => t.id === txId)
    let oldContactOwesAmount = 0
    let oldName = ''

    if (txIndex !== -1) {
      const oldTx = txList[txIndex]
      oldContactOwesAmount = oldTx.amount
      oldName = oldTx.name

      txList[txIndex] = {
        ...oldTx,
        name: data.description || 'Edited Expense',
        amount: contactOwesAmount,
        category: data.category as any,
        subtitle: paidBy === 'you' ? 'You paid' : `${contact.name.split(' ')[0]} paid`,
        splitType: splitData.type,
        dateValue: data.dateValue
      }
    }

    // Update contact's netAmount balance
    const diff = contactOwesAmount - oldContactOwesAmount
    contact.netAmount += diff

    // Update tags array
    const tagIndex = contact.tags.findIndex((t) => t.name === oldName || t.name === (data.description || 'New Split Expense'))
    if (tagIndex !== -1) {
      contact.tags[tagIndex].name = data.description || 'Edited Expense'
      contact.tags[tagIndex].amount = contactOwesAmount
    } else {
      contact.tags.push({
        name: data.description || 'Edited Expense',
        amount: contactOwesAmount
      })
    }
  }

  return (
    <AddExpenseBase
      title="Edit Expense"
      showPaidByAndSplit={true}
      contact={{
        id: contact.id,
        name: contact.name,
        initials: contact.initials,
        avatarColor: contact.avatarColor,
      }}
      initialData={initialData}
      onConfirm={handleConfirm}
      onSuccessComplete={onSuccess}
      onBack={onClose}
    />
  )
}
