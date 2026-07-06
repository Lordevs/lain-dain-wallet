import { useParams, useNavigate } from '@tanstack/react-router'
import AddExpenseBase, { type ConfirmExpenseData } from '@/components/shared/add-expense-base'
import { useContactStore } from '@/store/use-contact-store'
import { useTransactionStore } from '@/store/use-transaction-store'
import { calculateContactOwesAmount } from '@/lib/split'
import { ROUTES } from '@/constants/routes'

export default function EditContactExpenseScreen() {
  const { id: txId } = useParams({ from: '/transactions/$id/edit' })
  const navigate = useNavigate()

  const transactionsByContact = useTransactionStore((state) => state.transactionsByContact)
  let foundContactId = ''
  let tx = null

  for (const cId in transactionsByContact) {
    const t = transactionsByContact[cId].find((item) => item.id === txId)
    if (t) {
      foundContactId = cId
      tx = t
      break
    }
  }

  const contacts = useContactStore((state) => state.contacts)
  const contact = contacts.find((c) => c.id === foundContactId)

  if (!contact || !tx) {
    return (
      <div className="flex items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
        <div className="text-center">
          <p className="text-lg font-bold text-[#1A1A1A]">Transaction or Contact not found</p>
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

    const oldContactOwesAmount = tx ? tx.amount : 0
    const oldName = tx ? tx.name : ''

    // Update store
    if (tx) {
      const updatedTx = {
        ...tx,
        name: data.description || 'Edited Expense',
        amount: contactOwesAmount,
        category: data.category as any,
        subtitle: paidBy === 'you' ? 'You paid' : `${contact.name.split(' ')[0]} paid`,
        splitType: splitData.type,
        dateValue: data.dateValue
      }
      useTransactionStore.getState().updateTransaction(contact.id, updatedTx)
    }

    // Update contact's netAmount balance
    const diff = contactOwesAmount - oldContactOwesAmount
    const updatedNetAmount = contact.netAmount + diff

    // Update tags array
    const updatedTags = [...contact.tags]
    const tagIndex = updatedTags.findIndex((t) => t.name === oldName || t.name === (data.description || 'New Split Expense'))
    if (tagIndex !== -1) {
      updatedTags[tagIndex] = {
        name: data.description || 'Edited Expense',
        amount: contactOwesAmount
      }
    } else {
      updatedTags.push({
        name: data.description || 'Edited Expense',
        amount: contactOwesAmount
      })
    }

    useContactStore.getState().updateContact(contact.id, {
      netAmount: updatedNetAmount,
      tags: updatedTags
    })

    navigate({
      to: ROUTES.TRANSACTION_DETAILS,
      params: { id: tx.id },
      replace: true,
    })
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
      onSuccessComplete={() => {
        navigate({
          to: ROUTES.TRANSACTION_DETAILS,
          params: { id: tx.id },
          replace: true,
        })
      }}
      onBack={() => window.history.back()}
    />
  )
}
