import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, AlertTriangle, Smile, Info } from 'lucide-react'
import { useContactStore } from '@/store/use-contact-store'
import { ROUTES } from '@/constants/routes'
import { formatPKR } from '@/lib/currency'
import { cn } from '@/lib/utils'
import ExpenseList, { type ExpenseListData } from '@/components/shared/expense-list'
import ContactAvatar from '@/components/shared/contact-avatar'
import FlowHeader from '@/components/shared/flow-header'

// Styles mapper for group ledger icons and backgrounds matching the mockup
const getTagStyle = (tagName: string) => {
  const name = tagName.toLowerCase()
  if (name.includes('1-to-1') || name.includes('personal')) {
    return {
      bgColor: 'bg-[#E3F2FD]',
      textColor: 'text-[#1E3A8A]',
      icon: <Users size={18} className="text-[#1E3A8A]" />,
    }
  }
  if (name.includes('trip') || name.includes('murree')) {
    return {
      bgColor: 'bg-[#E8F5E9]',
      textColor: 'text-[#0B683A]',
      icon: <AlertTriangle size={18} className="text-[#0B683A]" />,
    }
  }
  // Default/Smile group style
  return {
    bgColor: 'bg-[#FFF3E6]',
    textColor: 'text-[#C96A1B]',
    icon: <Smile size={18} className="text-[#C96A1B]" />,
  }
}

interface LedgerBreakdownScreenProps {
  contactId: string
  onClose: () => void
}

export default function LedgerBreakdownScreen({ contactId, onClose }: LedgerBreakdownScreenProps) {
  const navigate = useNavigate()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null)

  const showToast = (message: string, type: 'success' | 'info' = 'info') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 2500)
  }

  // Find contact in mock data
  const contacts = useContactStore((state) => state.contacts)
  const contact = contacts.find((c) => c.id === contactId)

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
        <p className="text-muted-foreground text-sm mb-4">Contact not found</p>
        <button
          onClick={onClose}
          className="text-primary font-bold hover:underline border-0 bg-transparent cursor-pointer"
        >
          Close
        </button>
      </div>
    )
  }

  // Overall balance calculation
  const overallAmount = contact.netAmount
  const isPositive = overallAmount > 0
  const isNegative = overallAmount < 0
  const absOverall = Math.abs(overallAmount)
  const formattedOverall = formatPKR(absOverall)

  const overallAmountColorClass = isPositive
    ? 'text-[#0B683A]'
    : isNegative
      ? 'text-[#C96A1B]'
      : 'text-[#1A1A1A]'

  const ledgerItems: ExpenseListData[] = contact.tags.map((tag) => {
    const style = getTagStyle(tag.name)
    const subtitleText = tag.amount > 0
      ? `${contact.name.split(' ')[0]} owes you`
      : tag.amount < 0
        ? `You owe ${contact.name.split(' ')[0]}`
        : 'Settled up'

    return {
      id: tag.name,
      name: tag.name,
      amount: Math.abs(tag.amount),
      subtitle: subtitleText,
      amountColor: tag.amount > 0 ? 'green' : tag.amount < 0 ? 'orange' : 'black',
      showChevron: true,
      leftSlot: (
        <div className={cn("w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0", style.bgColor)}>
          {style.icon}
        </div>
      )
    }
  })

  const handleItemClick = (tagId: string | number) => {
    const tagName = String(tagId)
    const isOneToOne = tagName.toLowerCase().includes('1-to-1') || tagName.toLowerCase().includes('personal')
    if (isOneToOne) {
      navigate({
        to: ROUTES.CONTACT_DETAILS,
        params: { id: contact.id },
        replace: true,
      })
    } else {
      const foundGroup = contacts.find(
        (g) => g.type === 'group' && (
          tagName.toLowerCase().includes(g.name.toLowerCase()) ||
          g.name.toLowerCase().includes(tagName.toLowerCase())
        )
      )
      if (foundGroup) {
        navigate({
          to: ROUTES.GROUP_DETAILS,
          params: { id: foundGroup.id },
          replace: true,
        })
      } else {
        showToast(`Group ledger details not found.`)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex flex-col bg-[#FEFAF1] select-none pb-10 overflow-y-auto text-[#1A1A1A]">
      {/* Toast Alert overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-6 right-6 z-100 mx-auto max-w-[380px] bg-white/90 backdrop-blur-md border border-[#EFE7DD] shadow-[0px_10px_30px_rgba(0,0,0,0.08)] rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-[#FFF3E6] flex items-center justify-center text-[#C96A1B] shrink-0">
              <Info size={16} />
            </div>
            <span className="text-sm font-semibold text-[#1A1A1A]">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unified Header */}
      <FlowHeader
        title={contact.name}
        onBack={onClose}
        backVariant="minimal"
        avatar={
          <div className="relative shrink-0 flex items-center">
            <ContactAvatar
              initials={contact.initials}
              avatarColor={contact.avatarColor}
              size="md"
              className="size-11 text-sm font-bold"
            />
            {contact.isOnline && (
              <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#14A558] border border-[#FEFAF1] rounded-full" />
            )}
          </div>
        }
      />

      {/* Overall Summary Card */}
      <div className="px-6 mb-6 mt-4">
        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex items-center justify-between">
          <div className="flex flex-col text-left">
            <div className="flex items-baseline gap-2">
              <span className={cn("text-[32px] font-extrabold leading-none tracking-tight", overallAmountColorClass)}>
                {formattedOverall}
              </span>
              <span className="text-[#6B6B6B] text-[14px] font-semibold">
                overall
              </span>
            </div>
            <span className="text-[#6B6B6B] text-[13px] font-medium mt-2">
              Net across {contact.tags.length} ledgers
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="px-6 flex flex-col text-left">
        <h3 className="text-sm font-bold text-[#1A1A1A] mb-3">Breakdown by ledger</h3>

        <ExpenseList
          expenses={ledgerItems}
          onItemClick={handleItemClick}
          className="border-[#EFE7DD] divide-[#EFE7DD]"
        />
      </div>
    </div>
  )
}
