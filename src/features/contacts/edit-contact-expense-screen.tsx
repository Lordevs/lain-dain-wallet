import { useParams, useNavigate, useSearch } from '@tanstack/react-router'
import AddExpenseBase, { type ConfirmExpenseData } from '@/components/shared/add-expense-base'
import { MOCK_RECEIVABLES, MOCK_PAYABLES } from '@/features/dashboard/data/mock-data'
import { TRANSACTION_STORE } from '@/features/contacts/data/transaction-store'
import { ROUTES } from '@/constants/routes'

export default function EditContactExpenseScreen() {
  const { id } = useParams({ from: '/contacts/$id/edit-expense' })
  const search = useSearch({ from: '/contacts/$id/edit-expense' })
  const navigate = useNavigate()

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

  const txId = search.txId || ''

  // Prefill data configuration
  const initialData = {
    amount: search.amount || '',
    description: search.description || '',
    category: search.category || 'bills',
    dateValue: search.dateValue || 'Today',
    paidBy: search.paidBy || 'you',
    splitData: {
      type: 'equal' as const,
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

    // Calculate contactOwesAmount
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

    // Update store
    const txList = TRANSACTION_STORE[contact.id] || []
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
      onSuccessComplete={() => {
        navigate({ to: ROUTES.CONTACT_DETAILS, params: { id: contact.id } })
      }}
      onBack={() => {
        navigate({ to: ROUTES.CONTACT_DETAILS, params: { id: contact.id } })
      }}
    />
  )
}
