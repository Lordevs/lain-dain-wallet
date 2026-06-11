import { Check, AlertTriangle } from 'lucide-react'
import FlowHeader from '@/components/shared/flow-header'
import { type NotificationItem } from '../types'

interface PaymentConfirmationPanelProps {
  notification: NotificationItem
  onClose: () => void
  onConfirmReceived: () => void
  onDispute: () => void
}

/**
 * PaymentConfirmationPanel — sliding panel to verify and confirm received payments.
 * Matches mockup design exactly, including profile avatars, large green totals, row info grid, warning note, and action controls.
 */
export default function PaymentConfirmationPanel({
  notification,
  onClose,
  onConfirmReceived,
  onDispute,
}: PaymentConfirmationPanelProps) {
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

  const groupName = (notification.subtitle && notification.subtitle.toLowerCase().includes('for:'))
    ? notification.subtitle.replace(/For:/i, '').trim()
    : 'Murree Trip'

  const amountMatch = notification.title.match(/Rs\.\s*([\d,]+)/)
  const amountVal = amountMatch ? `Rs. ${amountMatch[1]}` : 'Rs. 2,000'

  return (
    <div className="fixed inset-0 z-60 bg-[#FEFAF1] flex flex-col select-none overflow-y-auto pb-36 animate-in fade-in slide-in-from-right duration-200 text-[#1A1A1A]">
      {/* Header */}
      <FlowHeader
        title="Payment Confirmation"
        onBack={onClose}
        backVariant="circle"
      />

      {/* Main Confirmation Card */}
      <div className="px-6 mt-4 text-left">
        <div className="bg-white rounded-[18px] border-[0.8px] border-[#EBEBEB] shadow-[0px_2px_10px_0px_#0000000D] p-5 flex flex-col">
          {/* Top Label */}
          <span className="text-xs font-bold text-primary">
            Payment confirmation · {notification.time || '1 hour ago'}
          </span>

          {/* Profile Details Row */}
          <div className="flex items-center gap-3.5 mt-4">
            <div className="w-12 h-12 rounded-full bg-[#E4F2EB] flex items-center justify-center shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Check size={16} className="text-white stroke-[3px]" />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-black text-xl text-[#1A1A1A] leading-tight">
                {requesterFullName}
              </span>
              <span className="text-xs text-[#6B6B6B] font-medium mt-0.5">
                Claims he has paid you
              </span>
            </div>
          </div>

          {/* Large Green Amount */}
          <span className="text-[34px] font-black text-primary mt-5 leading-none tracking-tight">
            {amountVal}
          </span>

          {/* Description */}
          <p className="text-[13px] font-medium text-[#6B6B6B] mt-4 leading-relaxed">
            {requesterFirstName} says he sent {amountVal} via Easypaisa. Please confirm if you received it.
          </p>
        </div>
      </div>

      {/* Summary Grid Metadata Rows */}
      <div className="px-6 mt-4 text-left">
        <div className="bg-white rounded-[18px] border-[0.8px] border-[#EBEBEB] shadow-[0px_2px_10px_0px_#0000000D] divide-y divide-[#EBEBEB] overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#6B6B6B]">Method</span>
            <span className="text-sm font-semibold text-[#1A1A1A]">Easypaisa</span>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#6B6B6B]">Date</span>
            <span className="text-sm font-semibold text-[#1A1A1A]">Today, 8:41 PM</span>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#6B6B6B]">Reference group</span>
            <span className="text-sm font-semibold text-[#1A1A1A]">{groupName}</span>
          </div>
        </div>
      </div>

      {/* Warning Notice Banner */}
      <div className="px-6 mt-4 text-left">
        <div className="bg-[#FFF9E6] rounded-[18px] border-[0.8px] border-[#C85A0026] p-5 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-tertiary">
            <AlertTriangle size={15} strokeWidth={2.5} className="text-tertiary" />
            <span className="text-[13px] font-semibold">Please verify before confirming</span>
          </div>
          <p className="text-xs text-[#6B6B6B] font-normal leading-relaxed">
            Check your Easypaisa or bank account to confirm you actually received this amount before tapping Confirm.
          </p>
        </div>
      </div>

      {/* Sticky Bottom Options Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-10 px-6 pt-4 pb-5 bg-[#FEFAF1]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
        <div className="w-full flex items-center gap-3.5">
          <button
            type="button"
            onClick={onConfirmReceived}
            // box-shadow: 0px 3px 10px 0px #0B683A47;
            className="flex-1 h-14 rounded-full bg-[#0B683A] text-white font-bold text-sm cursor-pointer shadow-[0px_3px_10px_0px_#0B683A47] active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
          >
            Confirm Received
          </button>
          <button
            type="button"
            onClick={onDispute}
            className="flex-1 h-14 rounded-full bg-tertiary text-white font-bold text-sm cursor-pointer active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
          >
            Dispute
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-[13px] font-semibold text-[#6B6B6B] cursor-pointer bg-transparent border-0 outline-none mt-1"
        >
          Decide later
        </button>
      </div>
    </div>
  )
}
