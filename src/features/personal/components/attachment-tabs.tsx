import { Calendar, Camera, Edit3 } from 'lucide-react'

interface AttachmentTabsProps {
  dateValue: string // e.g. "Today"
  receiptAttached: boolean
  noteAttached: boolean
  onToggleDate: () => void
  onToggleReceipt: () => void
  onToggleNote: () => void
}

export default function AttachmentTabs({
  dateValue,
  receiptAttached,
  noteAttached,
  onToggleDate,
  onToggleReceipt,
  onToggleNote,
}: AttachmentTabsProps) {
  return (
    <div className="flex items-center justify-center gap-12 px-5 py-3.5 shrink-0 bg-[#F7F5F0] border-t-[0.8px] border-[#EBEBEB]">
      {/* Date Tab */}
      <button
        type="button"
        onClick={onToggleDate}
        className="flex-1 flex flex-col items-center justify-center cursor-pointer bg-transparent border-0 outline-none"
      >
        <div
          className={`w-12 h-12 rounded-[14px] flex items-center justify-center transition-all ${dateValue === 'Today'
            ? 'bg-[#E4F2EB] border-[0.8px] border-[#0B683A4D]'
            : 'bg-white border-[0.8px] border-[#EBEBEB] shadow-[0px_1px_4px_rgba(0,0,0,0.03)]'
            }`}
        >
          <Calendar
            size={22}
            className={dateValue === 'Today' ? 'text-[#0B683A]' : 'text-[#6B6B6B]'}
            strokeWidth={1.5}
          />
        </div>
        <span
          className={`text-[13px] font-bold mt-2 transition-colors ${dateValue === 'Today' ? 'text-[#0B683A]' : 'text-[#6B6B6B]'
            }`}
        >
          {dateValue}
        </span>
      </button>

      {/* Receipt Tab */}
      <button
        type="button"
        onClick={onToggleReceipt}
        className="flex-1 flex flex-col items-center justify-center cursor-pointer bg-transparent border-0 outline-none"
      >
        <div
          className={`w-12 h-12 rounded-[14px] flex items-center justify-center transition-all ${receiptAttached
            ? 'bg-[#FFF9E6] border-[0.8px] border-[#FDB105]'
            : 'bg-white border-[0.8px] border-[#EBEBEB] shadow-[0px_1px_4px_rgba(0,0,0,0.03)]'
            }`}
        >
          <Camera
            size={22}
            className={receiptAttached ? 'text-[#C96A1B]' : 'text-[#FDB105]'}
            strokeWidth={1.5}
          />
        </div>
        <span
          className={`text-[13px] font-bold mt-2 transition-colors ${receiptAttached ? 'text-[#C96A1B]' : 'text-[#6B6B6B]'
            }`}
        >
          {receiptAttached ? 'Receipt ✓' : 'Receipt'}
        </span>
      </button>

      {/* Note Tab */}
      <button
        type="button"
        onClick={onToggleNote}
        className="flex-1 flex flex-col items-center justify-center cursor-pointer bg-transparent border-0 outline-none"
      >
        <div
          className={`w-12 h-12 rounded-[14px] flex items-center justify-center transition-all ${noteAttached
            ? 'bg-[#E3F2FD] border-[0.8px] border-[#1F618D]'
            : 'bg-white border-[0.8px] border-[#EBEBEB] shadow-[0px_1px_4px_rgba(0,0,0,0.03)]'
            }`}
        >
          <Edit3
            size={22}
            className={noteAttached ? 'text-[#1F618D]' : 'text-[#6B6B6B]'}
            strokeWidth={1.5}
          />
        </div>
        <span
          className={`text-[13px] font-bold mt-2 transition-colors ${noteAttached ? 'text-[#1F618D]' : 'text-[#6B6B6B]'
            }`}
        >
          {noteAttached ? 'Note ✓' : 'Note'}
        </span>
      </button>
    </div>
  )
}
