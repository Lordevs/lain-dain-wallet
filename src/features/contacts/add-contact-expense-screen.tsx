import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import AddExpenseBase, { type ConfirmExpenseData } from '@/components/shared/add-expense-base'
import { useContactStore } from '@/store/use-contact-store'
import { useTransactionStore } from '@/store/use-transaction-store'
import { calculateContactOwesAmount } from '@/lib/split'
import { ROUTES } from '@/constants/routes'

export default function AddContactExpenseScreen() {
  const { id: contactId } = useParams({ from: '/contacts/$id/add-expense' })
  const navigate = useNavigate()
  const [newTxId, setNewTxId] = useState<string | null>(null)

  // Find contact by id from store
  const contacts = useContactStore((state) => state.contacts)
  const contact = contacts.find((c) => c.id === contactId)

  if (!contact) {
    return (
      <div className="flex items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
        <div className="text-center">
          <p className="text-lg font-bold text-[#1A1A1A]">Contact not found</p>
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

    // Add to TRANSACTION_STORE
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const generatedId = 'tx-' + Date.now()
    const newTx = {
      id: generatedId,
      name: data.description || 'New Split Expense',
      subtitle: paidBy === 'you' ? 'You paid' : `${contact.name.split(' ')[0]} paid`,
      amount: contactOwesAmount,
      category: data.category as any,
      rightSubtitle: `Today, ${timeStr}`,
      splitType: splitData.type,
      dateValue: data.dateValue
    }
    useTransactionStore.getState().addTransaction(contact.id, newTx)

    // Add to contact's tags breakdown history
    const newTag = {
      name: data.description || 'New Split Expense',
      amount: contactOwesAmount,
    }
    const updatedTags = [...contact.tags, newTag]
    const updatedNetAmount = contact.netAmount + contactOwesAmount
    useContactStore.getState().updateContact(contact.id, {
      tags: updatedTags,
      netAmount: updatedNetAmount,
      ledgerCount: updatedTags.length
    })

    setNewTxId(generatedId)
  }

  return (
    <AddExpenseBase
      title="Add Lain Dain"
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
          navigate({
            to: ROUTES.TRANSACTION_DETAILS,
            params: { id: newTxId },
            replace: true,
          })
        } else {
          window.history.back()
        }
      }}
      onBack={() => window.history.back()}
    />
  )
}
