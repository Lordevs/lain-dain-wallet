import { useParams } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'
import FlowHeader from '@/components/shared/flow-header'
import { useNotifications } from '@/features/notifications/hooks/use-notifications'

/**
 * PaymentDisputePanel — sliding panel to display and resolve payment disputes.
 * Matches mockup design exactly, including warning avatars, large orange totals, row info grid, and action controls.
 */
export default function PaymentDisputePanel() {
  const { id } = useParams({ from: '/notifications/dispute/$id' })
  const { notifications, handleIgnore, triggerToast } = useNotifications()

  const notification = notifications.find((n) => n.id === id)

  if (!notification) {
    return (
      <div className="flex items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
        <div className="text-center">
          <p className="text-lg font-bold text-[#1A1A1A]">Payment dispute not found</p>
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
  // Parse name & group context dynamically
  let requesterFirstName = 'Muzaffar'
  const knownNames = ['Muzaffar', 'Sara', 'Ali', 'Ahmed', 'Arsalan']
  for (const name of knownNames) {
    if (notification.title.includes(name) || (notification.subtitle && notification.subtitle.includes(name))) {
      requesterFirstName = name
      break
    }
  }
  const requesterFullName = requesterFirstName === 'Muzaffar' ? 'Muzaffar Ali' : requesterFirstName === 'Sara' ? 'Sara Khan' : `${requesterFirstName} Hassan`

  const groupMatch = notification.subtitle && notification.subtitle.match(/from\s+([A-Za-z\s]+?)(?:\.|$)/i)
  const groupName = groupMatch ? groupMatch[1].trim() : 'Murree Trip'

  const amountMatch = (notification.subtitle && notification.subtitle.match(/Rs\.\s*([\d,]+)/)) || notification.title.match(/Rs\.\s*([\d,]+)/)
  const amountVal = amountMatch ? `Rs. ${amountMatch[1]}` : 'Rs. 2,000'

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[#FEFAF1] select-none pb-32 text-[#1A1A1A]">
      {/* Header */}
      <FlowHeader
        title="Payment Dispute"
        onBack={() => window.history.back()}
        backVariant="circle"
      />

      {/* Main Dispute Card */}
      <div className="px-6 mt-4 text-left">
        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] shadow-[0px_2px_10px_0px_#0000000D] p-5 flex flex-col">
          {/* Top Label */}
          <span className="text-[13px] font-semibold text-tertiary">
            Payment dispute · {notification.time || '5 days ago'}
          </span>

          {/* Profile Details Row */}
          <div className="flex items-center gap-3.5 mt-4">
            <div className="w-12 h-12 rounded-full bg-[#FFF3E6] flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-tertiary stroke-[2.5px]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-[17px] text-[#1A1A1A] leading-tight">
                By {requesterFullName}
              </span>
              <span className="text-xs text-[#6B6B6B] font-medium mt-0.5">
                {groupName}
              </span>
            </div>
          </div>

          {/* Large Orange Amount */}
          <span className="text-[34px] font-extrabold text-tertiary mt-5 leading-none tracking-tight">
            {amountVal}
          </span>

          {/* Description */}
          <p className="text-[13px] font-medium text-[#6B6B6B] mt-4 leading-relaxed">
            You marked {amountVal} as paid, but {requesterFirstName} says he never received the payment.
          </p>
        </div>
      </div>

      {/* Summary Grid Metadata Rows */}
      <div className="px-6 mt-4 text-left">
        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] shadow-[0px_2px_10px_0px_#0000000D] divide-y divide-[#EBEBEB] overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#6B6B6B]">Method you used</span>
            <span className="text-sm font-semibold text-[#1A1A1A]">Bank Transfer</span>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#6B6B6B]">Date you paid</span>
            <span className="text-sm font-semibold text-[#1A1A1A]">{notification.time || '5 days ago'}</span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Options Bar */}
      <div className="fixed bottom-3 left-3 right-3 z-10 flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            triggerToast('Redirecting to Payment screen...')
            window.history.back()
          }}
          className="flex-1 h-14 rounded-full bg-tertiary text-white font-extrabold text-base cursor-pointer active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
        >
          Pay Again
        </button>
        <button
          type="button"
          onClick={() => {
            handleIgnore(notification.id)
            window.history.back()
          }}
          className="flex-1 h-14 rounded-full bg-[#FDB105] text-[#1A1A1A] font-extrabold text-base cursor-pointer active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
        >
          Ignore
        </button>
      </div>
    </div>
  )
}
