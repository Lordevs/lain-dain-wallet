import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useContactStore } from '@/store/use-contact-store'
import { useContactLedgers } from '@/features/contacts/hooks/use-contact-ledgers'
import { useRequestSettlementMutation } from '@/features/notifications/api/use-notification-mutations'
import { formatCurrency } from '@/lib/currency'
import FlowHeader from '@/components/shared/flow-header'
import SuccessCheck from '@/components/shared/success-check'
import ContactAvatar from '@/components/shared/contact-avatar'
import { getInitials } from '@/lib/utils'

/**
 * SendReminderScreen — allows users to send reminders to contacts who owe them money.
 * Supports both real backend contacts (via useContactLedgers) and local contact store contacts.
 */
export default function SendReminderScreen() {
  const { id: contactId } = useParams({ from: '/contacts/$id/reminder' })
  const [showSuccess, setShowSuccess] = useState(false)

  const ledgers = useContactLedgers(contactId)
  const contacts = useContactStore((state) => state.contacts)
  const localContact = contacts.find((c) => c.id === contactId)
  const requestSettlement = useRequestSettlementMutation()

  if (ledgers.isLoading && !localContact) {
    return (
      <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-20 relative select-none overflow-hidden text-[#1A1A1A]">
        <FlowHeader title="Send Reminder" onBack={() => window.history.back()} backVariant="circle" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading contact...</p>
        </div>
      </div>
    )
  }

  const otherUser = ledgers.data?.other_user
  const name = otherUser?.full_name ?? localContact?.name
  const avatarImage = otherUser?.image ?? undefined

  const primaryBalance = ledgers.data?.ledgers.find((item) => item.scope === 'friendship')
  const amount = primaryBalance
    ? Number(primaryBalance.net_amount)
    : localContact
      ? Math.abs(localContact.netAmount)
      : 0
  const currency = primaryBalance?.currency ?? 'PKR'
  const formattedVal = formatCurrency(amount, currency)

  if (!name) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-[#FEFAF1] select-none text-[#1A1A1A] h-[50vh]">
        <p className="text-muted-foreground text-sm mb-4">Contact not found</p>
        <button
          onClick={() => window.history.back()}
          className="text-positive font-bold hover:underline border-0 bg-transparent cursor-pointer"
        >
          Close
        </button>
      </div>
    )
  }

  const handleSendReminder = () => {
    if (!contactId || !ledgers.friendshipId) return
    requestSettlement.mutate(
      { other_user_id: contactId, friendship_id: ledgers.friendshipId },
      {
        onSuccess: () => setShowSuccess(true),
        onError: (err) => toast.error(err.message),
      },
    )
  }

  const handleSuccessComplete = () => {
    window.history.back()
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col flex-1 bg-[#FEFAF1] h-full select-none justify-center">
        <SuccessCheck onComplete={handleSuccessComplete} />
      </div>
    )
  }

  const initials = getInitials(name)

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-20 relative select-none overflow-hidden text-[#1A1A1A]">
      {/* Header */}
      <FlowHeader
        title="Send Reminder"
        onBack={() => window.history.back()}
        backVariant="circle"
      />

      {/* Main Content (Centered Profile Section) */}
      <div className="flex-1 flex flex-col items-center justify-center py-10 px-6">
        {/* Avatar */}
        <div className="size-28 rounded-full bg-[#E4F2EB] flex items-center justify-center shadow-[0px_4px_12px_rgba(11,104,58,0.08)] border border-positive/10 shrink-0 overflow-hidden">
          {avatarImage ? (
            <img src={avatarImage} alt={name} className="size-full object-cover" />
          ) : (
            <ContactAvatar
              initials={initials}
              avatarColor="bg-[#E4F2EB] text-positive"
              size="lg"
              className="size-full text-2xl font-extrabold"
            />
          )}
        </div>

        {/* Uppercase Name */}
        <h2 className="mt-6 text-2xl font-extrabold text-[#1A1A1A] uppercase tracking-wide text-center">
          {name}
        </h2>

        {/* Subtitle */}
        <p className="mt-3 text-sm font-semibold text-[#6B6B6B]">
          owes you
        </p>

        {/* Amount */}
        <p className="mt-1 text-2xl font-black text-[#1A1A1A]">
          {formattedVal}
        </p>
      </div>

      {/* Sticky Bottom Send Reminder button */}
      <div className="safe-action-fixed z-10">
        <button
          type="button"
          disabled={!ledgers.friendshipId || requestSettlement.isPending}
          onClick={handleSendReminder}
          className="w-full h-14 rounded-full bg-[#FDB105] text-[#1A1A1A] font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {requestSettlement.isPending ? 'Sending...' : 'Send Reminder'}
        </button>
      </div>
    </div>
  )
}
