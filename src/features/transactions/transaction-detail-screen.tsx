import { useParams, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MOCK_RECEIVABLES, MOCK_PAYABLES } from '@/features/dashboard/data/mock-data'
import { TRANSACTION_STORE } from '@/features/contacts/data/transaction-store'
import { ROUTES } from '@/constants/routes'
import { CATEGORIES } from '@/features/personal/components/category-picker'

const getCategoryEmoji = (id: string) => {
  switch (id) {
    case 'transport': return '🚗'
    case 'shopping': return '🛍️'
    case 'grocery': return '🛒'
    case 'bills': return '🧾'
    case 'entertainment': return '🎬'
    case 'health': return '🏥'
    case 'fuel': return '⛽'
    case 'food': return '🍔'
    case 'payment': return '🤝'
    default: return '📦'
  }
}

export default function TransactionDetailScreen() {
  const { id } = useParams({ from: '/transactions/$id' })
  const navigate = useNavigate()

  // Find transaction and contact ID
  let foundContactId = ''
  let tx = null

  for (const contactId in TRANSACTION_STORE) {
    const t = TRANSACTION_STORE[contactId].find((item) => item.id === id)
    if (t) {
      foundContactId = contactId
      tx = t
      break
    }
  }

  // Find contact
  const contact = [...MOCK_RECEIVABLES, ...MOCK_PAYABLES].find((c) => c.id === foundContactId)

  if (!tx || !contact) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#FEFAF1] select-none text-[#1A1A1A]">
        <p className="text-muted-foreground text-sm mb-4">Transaction not found</p>
        <button
          onClick={() => navigate({ to: '/' })}
          className="text-primary font-bold hover:underline border-0 bg-transparent cursor-pointer"
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  const absAmount = Math.abs(tx.amount)
  const totalExp = tx.category === 'payment' ? absAmount : absAmount * 2
  const paidByText = tx.amount > 0 ? 'You (full amount)' : `${contact.name} (full amount)`
  const splitTypeText = tx.category === 'payment' ? 'Direct Payment' : 'Equal · 2 people'
  const shareText = `Rs. ${absAmount.toLocaleString('en-US')}`

  const categoryObj = CATEGORIES.find((c) => c.id === tx.category) || { label: 'Other', icon: null }
  const categoryName = tx.category === 'payment' ? 'Payment' : categoryObj.label
  const categoryEmoji = getCategoryEmoji(tx.category)
  const dateString = tx.rightSubtitle.includes('PM') || tx.rightSubtitle.includes('AM')
    ? `Today, ${tx.rightSubtitle}`
    : tx.rightSubtitle

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none text-[#1A1A1A]">
      {/* Header */}
      <div className="flex items-center px-6 pt-5 pb-3 relative shrink-0">
        <button
          onClick={() => navigate({ to: ROUTES.CONTACT_DETAILS, params: { id: contact.id } })}
          className="size-10 rounded-full bg-white border border-[#EBEBEB] flex items-center justify-center cursor-pointer shadow-[0px_2px_8px_rgba(0,0,0,0.04)] outline-none"
        >
          <ChevronLeft size={20} className="text-[#1A1A1A]" />
        </button>
        <h3 className="text-lg font-extrabold text-[#1A1A1A] absolute left-1/2 -translate-x-1/2">
          Lain Dain Details
        </h3>
      </div>

      {/* Center Total Summary */}
      <div className="flex flex-col items-center justify-center py-10 shrink-0">
        <span className="text-[13px] font-medium text-[#6B6B6B]">Total Expense</span>
        <span className="text-[38px] font-extrabold text-[#0B683A] mt-1.5 tracking-tight leading-none">
          Rs. {totalExp.toLocaleString('en-US')}
        </span>

        {/* Overlapping Avatars */}
        <div className="flex items-center justify-center -space-x-3 mt-5">
          <div className="size-10 rounded-full bg-[#0B683A] border-[2.2px] border-[#FEFAF1] flex items-center justify-center text-white font-extrabold text-xs shadow-sm z-10 select-none">
            MH
          </div>
          <div className={cn("size-10 rounded-full border-[2.2px] border-[#FEFAF1] flex items-center justify-center text-white font-extrabold text-xs shadow-sm select-none", contact.avatarColor)}>
            {contact.initials}
          </div>
        </div>
      </div>

      {/* Summary Card and Fields */}
      <div className="flex-1 px-6 pb-8">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[15px] font-bold text-[#6B6B6B]">Summary</span>
          <button
            onClick={() => {
              navigate({
                to: '/contacts/$id/edit-expense',
                params: { id: contact.id },
                search: {
                  amount: absAmount.toString(),
                  description: tx.name,
                  category: tx.category,
                  dateValue: tx.dateValue || 'Today',
                  paidBy: tx.amount > 0 ? 'you' : 'contact',
                  txId: tx.id
                }
              })
            }}
            className="flex items-center gap-1.5 text-[13px] font-bold text-[#0B683A] bg-transparent border-0 outline-none cursor-pointer hover:opacity-80 transition-opacity"
          >
            Edit <Pencil size={14} className="stroke-[2.5px]" />
          </button>
        </div>

        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EBEBEB] overflow-hidden">
          {/* Description Row */}
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm font-medium text-[#6B6B6B]">Description</span>
            <span className="text-sm font-bold text-[#1A1A1A]">{tx.name || 'Unnamed Expense'}</span>
          </div>

          {/* Category Row */}
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm font-medium text-[#6B6B6B]">Category</span>
            <span className="text-sm font-bold text-[#1A1A1A] flex items-center gap-1.5">
              <span>{categoryEmoji}</span> {categoryName}
            </span>
          </div>

          {/* Group Row */}
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm font-medium text-[#6B6B6B]">Group</span>
            <span className="text-sm font-bold text-[#1A1A1A]">Murree Trip</span>
          </div>

          {/* Date Row */}
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm font-medium text-[#6B6B6B]">Date</span>
            <span className="text-sm font-bold text-[#1A1A1A]">{dateString}</span>
          </div>

          {/* Paid By Row */}
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm font-medium text-[#6B6B6B]">Paid by</span>
            <span className="text-sm font-semibold text-[#0B683A]">{paidByText}</span>
          </div>

          {/* Split Type Row */}
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm font-medium text-[#6B6B6B]">Split type</span>
            <span className="text-sm font-bold text-[#1A1A1A]">{splitTypeText}</span>
          </div>

          {/* Your Share Row */}
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm font-medium text-[#6B6B6B]">Your share</span>
            <span className="text-sm font-bold text-[#0B683A]">{shareText}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
