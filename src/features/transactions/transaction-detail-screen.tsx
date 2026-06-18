import { useState, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, Pencil, Trash2, FileText, Coffee, HelpCircle, Download, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { MOCK_RECEIVABLES, MOCK_PAYABLES } from '@/features/dashboard/data/mock-data'
import { TRANSACTION_STORE } from '@/features/contacts/data/transaction-store'
import { ROUTES } from '@/constants/routes'
import { CATEGORIES } from '@/features/personal/components/category-picker'
import receiptMockup from '@/assets/receipt_mockup.png'

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

  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const absAmount = Math.abs(tx.amount)
  const paidByText = tx.amount > 0 ? 'You (full amount)' : `${contact.name} (full amount)`

  const categoryObj = CATEGORIES.find((c) => c.id === tx.category) || { label: 'Other', icon: HelpCircle, color: '#7F8C8D' }
  const categoryName = tx.category === 'payment' ? 'Payment' : categoryObj.label
  const categoryEmoji = getCategoryEmoji(tx.category)

  const CategoryIcon = tx.name.toLowerCase().includes('hotel') ? Coffee : (categoryObj.icon || HelpCircle)
  const categoryColor = tx.name.toLowerCase().includes('hotel') ? '#C96A1B' : (categoryObj.color || '#7F8C8D')

  const groupName = contact.type === 'group' ? contact.name : 'Murree Trip'
  const dateStr = tx.dateValue || 'Today, 18 May 2026'
  const noteText = tx.note || 'Pearl Continental, Murree'
  const shareVal = absAmount === 3000 ? 1250 : Math.round(absAmount / 2)
  const formattedShare = `Rs. ${shareVal.toLocaleString('en-US')}`

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = receiptMockup
    link.download = `Receipt_${tx.name.replace(/\s+/g, '_')}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setToast({ message: 'Receipt image downloaded successfully!', type: 'success' })
  }

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none text-[#1A1A1A] pb-24 relative">
      {/* Toast Alert overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-6 right-6 z-[120] mx-auto max-w-[380px] bg-white/90 backdrop-blur-md border border-[#EFE7DD] shadow-[0px_10px_30px_rgba(0,0,0,0.08)] rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-[#E4F2EB] flex items-center justify-center text-[#0B683A] shrink-0">
              <Check size={16} strokeWidth={3} />
            </div>
            <span className="text-sm font-semibold text-[#1A1A1A]">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center px-6 pt-5 pb-3 relative shrink-0">
        <button
          onClick={() => {
            if (contact.type === 'group') {
              navigate({ to: ROUTES.GROUP_DETAILS, params: { id: contact.id } })
            } else {
              navigate({ to: ROUTES.CONTACT_DETAILS, params: { id: contact.id } })
            }
          }}
          className="size-10 rounded-full bg-white border border-[#EBEBEB] flex items-center justify-center cursor-pointer shadow-[0px_2px_8px_rgba(0,0,0,0.04)] outline-none"
        >
          <ChevronLeft size={20} className="text-[#1A1A1A]" />
        </button>
        <h3 className="text-lg font-extrabold text-[#1A1A1A] absolute left-1/2 -translate-x-1/2">
          Expense Details
        </h3>
      </div>

      {/* Main Info Card */}
      <div className="px-6 mb-6 mt-4">
        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex flex-col text-left">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-[18px] flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${categoryColor}15` }}
            >
              <CategoryIcon size={26} style={{ color: categoryColor }} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[17px] text-[#1A1A1A] leading-none">
                {tx.name || 'Unnamed Expense'}
              </span>
              <span className="text-[12px] text-[#6B6B6B] font-medium mt-1.5 leading-none">
                {contact.name}
              </span>
            </div>
          </div>

          <span className="text-[34px] font-extrabold text-[#1A1A1A] mt-6 tracking-tight leading-none">
            Rs. {absAmount.toLocaleString('en-US')}
          </span>

          <span className="text-[13px] text-[#6B6B6B] font-semibold mt-3.5 leading-none">
            {tx.amount > 0 ? 'You paid the full amount' : `${contact.name.split(' ')[0]} paid the full amount`}
          </span>
        </div>
      </div>

      {/* Scrollable breakdown container */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-6">
        
        {/* Summary Card */}
        <div className="flex flex-col text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[15px] font-bold text-[#6B6B6B]">Summary</span>
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
              <span className="text-sm font-bold text-[#1A1A1A]">{groupName}</span>
            </div>

            {/* Date Row */}
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-medium text-[#6B6B6B]">Date</span>
              <span className="text-sm font-bold text-[#1A1A1A]">{dateStr}</span>
            </div>

            {/* Paid By Row */}
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-medium text-[#6B6B6B]">Paid by</span>
              <span className="text-sm font-bold text-[#0B683A]">{paidByText}</span>
            </div>

            {/* Receipt Row */}
            <div className="px-5 py-3.5 flex items-center justify-between">
              <span className="text-sm font-medium text-[#6B6B6B]">Receipt</span>
              <button
                type="button"
                onClick={() => setIsReceiptOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#EBEBEB] bg-white text-[12px] font-bold text-[#6B6B6B] hover:bg-[#F7F5F0] transition-colors cursor-pointer outline-none active:scale-95 shadow-[0px_1px_3px_rgba(0,0,0,0.02)]"
              >
                <FileText size={13} className="text-[#C0392B]" />
                Receipt.pdf
              </button>
            </div>

            {/* Note Row */}
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-medium text-[#6B6B6B]">Note</span>
              <span className="text-sm font-medium text-[#6B6B6B]">{noteText}</span>
            </div>

            {/* Your Share Row */}
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-medium text-[#6B6B6B]">Your share</span>
              <span className="text-sm font-extrabold text-[#1A1A1A]">{formattedShare}</span>
            </div>
          </div>
        </div>

        {/* How It Was Split Section */}
        <div className="flex flex-col text-left mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              How it was split
            </span>
            <span className="text-[13px] font-bold text-[#1A1A1A]">
              {tx.splitType === 'unequal' ? 'Un-Equal' : 'Equal'}
            </span>
          </div>

          <div className="bg-white border border-[#EFE7DD] rounded-[24px] divide-y divide-[#EFE7DD] overflow-hidden shadow-[0px_4px_16px_rgba(0,0,0,0.02)]">
            {/* Item 1: You */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0B683A] text-white flex items-center justify-center font-extrabold text-sm shadow-[0px_2px_8px_rgba(11,104,58,0.12)] select-none">
                  MH
                </div>
                <span className="font-bold text-sm text-[#1A1A1A]">You</span>
              </div>
              <span className="font-extrabold text-sm text-[#C96A1B]">
                Rs. {tx.splitType === 'unequal' ? '1,000' : (absAmount / 2).toLocaleString('en-US')}
              </span>
            </div>

            {/* Item 2: Contact */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-full text-white flex items-center justify-center font-extrabold text-sm shadow-sm select-none", contact.avatarColor || 'bg-[#1E3A8A]')}>
                  {contact.initials}
                </div>
                <span className="font-bold text-sm text-[#1A1A1A]">{contact.name}</span>
              </div>
              <span className="font-extrabold text-sm text-[#1A1A1A]">
                Rs. {tx.splitType === 'unequal' ? '2,000' : (absAmount / 2).toLocaleString('en-US')}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-10 px-6 py-4 bg-[#FEFAF1]/90 flex items-center gap-4 border-t border-[#EFE7DD]/30 backdrop-blur-sm">
        {/* Edit Button */}
        <button
          type="button"
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
          className="flex-1 h-14 rounded-[20px] bg-white border border-[#EFE7DD] text-[#6B6B6B] font-extrabold text-base cursor-pointer shadow-sm hover:bg-muted/5 transition-colors flex items-center justify-center gap-2 outline-none"
        >
          <Pencil size={18} className="text-[#6B6B6B]" />
          Edit
        </button>

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => {
            // Remove from TRANSACTION_STORE
            if (TRANSACTION_STORE[contact.id]) {
              TRANSACTION_STORE[contact.id] = TRANSACTION_STORE[contact.id].filter((t) => t.id !== tx.id)
            }
            // Update contact netAmount balance
            contact.netAmount -= tx.amount
            contact.ledgerCount = contact.tags.length
            // Navigate back
            if (contact.type === 'group') {
              navigate({ to: ROUTES.GROUP_DETAILS, params: { id: contact.id } })
            } else {
              navigate({ to: ROUTES.CONTACT_DETAILS, params: { id: contact.id } })
            }
          }}
          className="flex-1 h-14 rounded-[20px] bg-[#FFF3F3] border border-[#C0392B40] text-[#C0392B] font-extrabold text-base cursor-pointer shadow-sm hover:bg-[#FFF3F3]/80 transition-colors flex items-center justify-center gap-2 outline-none"
        >
          <Trash2 size={18} className="text-[#C0392B]" />
          Delete
        </button>
      </div>

      {/* Receipt Preview Overlay */}
      <AnimatePresence>
        {isReceiptOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed inset-0 z-50 bg-[#FEFAF1]"
          >
            <ReceiptPreviewFlow
              isOpen={isReceiptOpen}
              onClose={() => setIsReceiptOpen(false)}
              tx={tx}
              onDownload={handleDownload}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface ReceiptPreviewFlowProps {
  isOpen: boolean
  onClose: () => void
  tx: any
  onDownload: () => void
}

function ReceiptPreviewFlow({
  onClose,
  tx,
  onDownload,
}: ReceiptPreviewFlowProps) {

  return (
    <div className="flex flex-col h-full select-none overflow-y-auto pb-8">
      {/* Header */}
      <div className="flex items-center px-6 pt-5 pb-3 relative shrink-0">
        <button
          onClick={onClose}
          className="size-10 rounded-full bg-white border border-[#EBEBEB] flex items-center justify-center cursor-pointer shadow-[0px_2px_8px_rgba(0,0,0,0.04)] outline-none"
        >
          <ChevronLeft size={20} className="text-[#1A1A1A]" />
        </button>
        <h3 className="text-lg font-extrabold text-[#1A1A1A] absolute left-1/2 -translate-x-1/2">
          Receipt Preview
        </h3>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-6 flex flex-col items-center justify-between">
        <div className="w-full max-w-[380px] bg-white rounded-[28px] border border-[#EFE7DD] shadow-[0px_8px_32px_rgba(26,26,26,0.03)] overflow-hidden flex flex-col p-3 mt-2">
          <div className="w-full bg-[#F7F5F0] rounded-[20px] overflow-hidden flex items-center justify-center border border-[#EFE7DD]/40 relative aspect-square">
            <img
              src={receiptMockup}
              alt="Uploaded Receipt"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
          
          <div className="mt-4 flex items-center justify-between px-2 pb-1">
            <div className="flex flex-col text-left">
              <span className="text-[14px] font-extrabold text-[#1A1A1A] max-w-[200px] truncate">
                {tx.name ? `${tx.name.replace(/\s+/g, '_')}_Receipt.png` : 'Receipt_Hotel_Booking.png'}
              </span>
              <span className="text-[11px] font-semibold text-[#9A9590] mt-0.5">
                1.05 MB • PNG Image
              </span>
            </div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#0B683A] bg-[#E4F2EB] px-3 py-1 rounded-full">
              Uploaded
            </div>
          </div>
        </div>

        {/* Download Action Button */}
        <button
          type="button"
          onClick={onDownload}
          className="w-full max-w-[380px] h-14 rounded-[20px] bg-[#0B683A] text-white font-extrabold text-base cursor-pointer shadow-[0px_4px_16px_rgba(11,104,58,0.16)] hover:bg-[#0B683A]/90 transition-all flex items-center justify-center gap-2 outline-none mt-6"
        >
          <Download size={18} />
          Download Receipt
        </button>
      </div>
    </div>
  )
}
