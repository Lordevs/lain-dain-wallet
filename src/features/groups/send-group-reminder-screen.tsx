import { useState } from 'react'
import { User } from 'lucide-react'
import { useContactStore } from '@/store/use-contact-store'
import { formatPKR } from '@/lib/currency'
import FlowHeader from '@/components/shared/flow-header'
import SuccessCheck from '@/components/shared/success-check'

/**
 * SendGroupReminderScreen — allows users to send reminders to groups who owe them money.
 */
interface SendGroupReminderScreenProps {
  groupId: string
  onClose: () => void
}

export default function SendGroupReminderScreen({ groupId, onClose }: SendGroupReminderScreenProps) {
  const [showSuccess, setShowSuccess] = useState(false)

  // Find group by id from store
  const contacts = useContactStore((state) => state.contacts)
  const contact = contacts.find((c) => c.id === groupId)

  if (!contact || contact.type !== 'group') {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-[#FEFAF1] select-none text-[#1A1A1A] h-[50vh]">
        <p className="text-muted-foreground text-sm mb-4">Group not found</p>
        <button
          onClick={onClose}
          className="text-primary font-bold hover:underline border-0 bg-transparent cursor-pointer"
        >
          Close
        </button>
      </div>
    )
  }

  const absAmount = Math.abs(contact.netAmount)
  const formattedVal = formatPKR(absAmount)

  const handleSendReminder = () => {
    setShowSuccess(true)
  }

  const handleSuccessComplete = () => {
    onClose()
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col flex-1 bg-[#FEFAF1] h-full select-none justify-center">
        <SuccessCheck onComplete={handleSuccessComplete} />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-60 flex flex-col bg-[#FEFAF1] select-none overflow-hidden text-[#1A1A1A]">
      {/* Header */}
      <FlowHeader
        title="Send Reminder"
        onBack={onClose}
        backVariant="circle"
      />

      {/* Main Content (Centered Profile Section) */}
      <div className="flex-1 flex flex-col items-center justify-center py-10 px-6">
        {/* Large green Avatar placeholder */}
        <div className="w-28 h-28 rounded-full bg-[#E4F2EB] flex items-center justify-center shadow-[0px_4px_12px_rgba(11,104,58,0.08)] border border-positive/10 shrink-0">
          <User className="w-16 h-16 text-positive fill-positive/10" />
        </div>

        {/* Uppercase Name */}
        <h2 className="mt-6 text-2xl font-extrabold text-[#1A1A1A] uppercase tracking-wide">
          {contact.name}
        </h2>

        {/* Subtitle */}
        <p className="mt-3 text-sm font-semibold text-[#6B6B6B]">
          owes you
        </p>

        {/* Amount */}
        <p className="mt-1 text-sm font-bold text-[#1A1A1A]">
          {formattedVal}
        </p>
      </div>

      {/* Sticky Bottom Send Reminder button */}
      <div className="fixed bottom-3 left-3 right-3 z-10">
        <button
          type="button"
          onClick={handleSendReminder}
          className="w-full h-14 rounded-full bg-[#FDB105] text-[#1A1A1A] font-extrabold text-base cursor-pointer  hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
        >
          Send Reminder
        </button>
      </div>
    </div>
  )
}
