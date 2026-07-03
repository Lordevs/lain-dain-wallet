import { Camera, Edit3, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RecurringFrequency } from './frequency-toggle'

interface RecurringAttachmentsStripProps {
  frequency: RecurringFrequency
  onToggleFrequency: () => void
  hasReceipt: boolean
  onToggleReceipt: () => void
  hasNote: boolean
  onToggleNote: () => void
}

/** Footer quick-action row: frequency indicator + receipt + note triggers. */
export default function RecurringAttachmentsStrip({
  frequency,
  onToggleFrequency,
  hasReceipt,
  onToggleReceipt,
  hasNote,
  onToggleNote,
}: RecurringAttachmentsStripProps) {
  return (
    <div className="flex items-center justify-between gap-12 px-12 py-4.5 shrink-0 bg-hover-bg border-t border-divider">
      {/* Repeats Quick Indicator */}
      <button
        type="button"
        onClick={onToggleFrequency}
        className="flex flex-col items-center justify-center bg-transparent border-0 outline-none cursor-pointer"
      >
        <div className="w-12 h-12 rounded-[16px] bg-positive-soft-bg flex items-center justify-center transition-all shadow-[0px_1px_4px_rgba(0,0,0,0.02)]">
          <RefreshCw size={18} className="text-positive" strokeWidth={2} />
        </div>
        <span className="text-[11px] font-extrabold mt-1.5 text-positive">
          {frequency}
        </span>
      </button>

      {/* Receipt Trigger */}
      <button
        type="button"
        onClick={onToggleReceipt}
        className="flex flex-col items-center justify-center bg-transparent border-0 outline-none cursor-pointer"
      >
        <div className={cn(
          "w-12 h-12 rounded-[16px] flex items-center justify-center transition-all",
          hasReceipt
            ? "bg-[#FFF9E6] border border-secondary/50"
            : "bg-white border border-divider shadow-[0px_1px_4px_rgba(0,0,0,0.02)]"
        )}>
          <Camera size={18} className={hasReceipt ? "text-orange-payable" : "text-secondary"} strokeWidth={2} />
        </div>
        <span className={cn(
          "text-[11px] font-extrabold mt-1.5 transition-colors",
          hasReceipt ? "text-orange-payable" : "text-muted-foreground"
        )}>
          {hasReceipt ? "Receipt ✓" : "Receipt"}
        </span>
      </button>

      {/* Note Trigger */}
      <button
        type="button"
        onClick={onToggleNote}
        className="flex flex-col items-center justify-center bg-transparent border-0 outline-none cursor-pointer"
      >
        <div className={cn(
          "w-12 h-12 rounded-[16px] flex items-center justify-center transition-all",
          hasNote
            ? "bg-[#E3F2FD] border border-[#1F618D]/50"
            : "bg-white border border-divider shadow-[0px_1px_4px_rgba(0,0,0,0.02)]"
        )}>
          <Edit3 size={18} className={hasNote ? "text-[#1F618D]" : "text-muted-foreground"} strokeWidth={2} />
        </div>
        <span className={cn(
          "text-[11px] font-extrabold mt-1.5 transition-colors",
          hasNote ? "text-[#1F618D]" : "text-muted-foreground"
        )}>
          {hasNote ? "Note ✓" : "Note"}
        </span>
      </button>
    </div>
  )
}
