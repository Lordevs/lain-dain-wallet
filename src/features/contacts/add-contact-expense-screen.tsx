import { useParams, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import AddExpenseBase, { type ConfirmExpenseData } from '@/components/shared/add-expense-base'
import { MOCK_RECEIVABLES, MOCK_PAYABLES } from '@/features/dashboard/data/mock-data'
import { ROUTES } from '@/constants/routes'
import { TRANSACTION_STORE } from '@/features/contacts/data/transaction-store'

export default function AddContactExpenseScreen() {
  const { id } = useParams({ from: '/contacts/$id/add-expense' })
  const navigate = useNavigate()

  const [newTxId, setNewTxId] = useState<string | null>(null)

  // Find contact by id from mock data
  const contact = [...MOCK_RECEIVABLES, ...MOCK_PAYABLES].find((c) => c.id === id)

  if (!contact) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEFAF1]">
        <div className="text-center">
          <p className="text-lg font-bold text-[#1A1A1A]">Contact not found</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="mt-4 px-4 py-2 bg-[#0B683A] text-white rounded-full font-bold"
          >
            Go to Dashboard
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

    // Add to contact's tags breakdown history
    const newTag = {
      name: data.description || 'New Split Expense',
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
      name: data.description || 'New Split Expense',
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
          navigate({ to: `/transactions/${newTxId}` })
        } else {
          navigate({ to: ROUTES.CONTACT_DETAILS, params: { id: contact.id } })
        }
      }}
      onBack={() => {
        navigate({ to: ROUTES.CONTACT_DETAILS, params: { id: contact.id } })
      }}
    />
  )
}
