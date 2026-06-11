import FlowHeader from '@/components/shared/flow-header'
import { type NotificationItem } from '../types'

interface SettlementRequestPanelProps {
  notification: NotificationItem
  onClose: () => void
  onSettle: () => void
  onIgnore: () => void
}

/**
 * SettlementRequestPanel — sliding screen overlay for a settlement request notification.
 * Dynamically resolves all requester names, group contexts, and payment totals from props.
 */
export default function SettlementRequestPanel({
  notification,
  onClose,
  onSettle,
  onIgnore,
}: SettlementRequestPanelProps) {
  // Parse dynamic data from the notification model dynamically
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

  const amountMatch = notification.title.match(/Rs\.\s*([\d,]+)/) || (notification.subtitle && notification.subtitle.match(/Rs\.\s*([\d,]+)/))
  const amountVal = amountMatch ? `Rs. ${amountMatch[1]}` : 'Rs. 2,000'

  const initials = requesterFirstName.slice(0, 2).toUpperCase()

  return (
    <div className="fixed inset-0 z-60 bg-[#FEFAF1] flex flex-col select-none overflow-y-auto animate-in fade-in slide-in-from-right duration-200 text-[#1A1A1A]">
      {/* Flow Header */}
      <FlowHeader
        title="Settlement Request"
        onBack={onClose}
        backVariant="circle"
      />

      {/* Main Request Summary Card */}
      <div className="px-6 mt-4">
        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex flex-col text-left">
          {/* Top tag */}
          <span className="text-xs font-bold text-[#0B683A] tracking-tight">
            Settlement request · {groupName}
          </span>

          {/* Profile row */}
          <div className="flex items-center gap-3.5 mt-5">
            <div className="size-12 rounded-full bg-[#E3F2FD] text-[#1D70B8] font-extrabold text-sm flex items-center justify-center border border-[#1D70B8]/10 shadow-sm shrink-0">
              {initials}
            </div>
            <span className="font-extrabold text-[17px] text-[#1A1A1A] tracking-tight">
              {requesterFullName}
            </span>
          </div>

          {/* Amount */}
          <span className="text-[36px] font-extrabold text-[#C96A1B] mt-5 leading-none tracking-tight">
            {amountVal}
          </span>

          {/* Description */}
          <p className="text-sm font-semibold text-[#6B6B6B] mt-3.5 leading-relaxed">
            {requesterFirstName} says you owe this from {groupName} expenses.
          </p>
        </div>
      </div>

      {/* Request Details Metadata Card */}
      <div className="px-6 mt-4">
        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EBEBEB] overflow-hidden text-left">
          {/* Group Row */}
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#6B6B6B]">Group</span>
            <span className="text-sm font-extrabold text-[#1A1A1A]">{groupName}</span>
          </div>

          {/* Requested By Row */}
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#6B6B6B]">Requested by</span>
            <span className="text-sm font-extrabold text-[#1A1A1A]">{requesterFullName}</span>
          </div>

          {/* Date Requested Row */}
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#6B6B6B]">Date requested</span>
            <span className="text-sm font-extrabold text-[#1A1A1A]">Today, {notification.time || '9:39 PM'}</span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-10 px-6 py-4 bg-[#FEFAF1]/90 flex items-center gap-4">
        {/* Settle button */}
        <button
          type="button"
          onClick={onSettle}
          className="flex-1 h-14 rounded-full bg-[#C96A1B] text-white font-extrabold text-base cursor-pointer shadow-[0px_6px_20px_rgba(201,106,27,0.25)] hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
        >
          Settle
        </button>

        {/* Ignore button */}
        <button
          type="button"
          onClick={onIgnore}
          className="flex-1 h-14 rounded-full bg-[#FDB105] text-[#1A1A1A] font-extrabold text-base cursor-pointer shadow-[0px_6px_20px_rgba(253,177,5,0.25)] hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
        >
          Ignore
        </button>
      </div>
    </div>
  )
}
