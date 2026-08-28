import { RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'

interface AdjustBalancesCardProps {
  adjustableAmount: number
  currency: string
  onAdjustClick: () => void
}

/** Shown at the bottom of LedgerBreakdownScreen only when
 * useLedgerAdjustmentQuery finds something to net — "you both owe each
 * other" across different ledgers/groups, so part of it can cancel out
 * without anyone actually paying. */
export default function AdjustBalancesCard({ adjustableAmount, currency, onAdjustClick }: AdjustBalancesCardProps) {
  return (
    <div className="bg-[#E4F2EB] border-[1.5px] border-[#0B683A26] rounded-[20px] p-3 flex items-center gap-3.5 shadow-[0px_4px_16px_rgba(0,0,0,0.01)] text-left">
      <div className="size-9 rounded-full bg-positive flex items-center justify-center shrink-0">
        <RefreshCw size={18} className="text-white" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-bold text-[12px] text-[#1A1A1A] leading-tight">You both owe each other</span>
        <span className="text-[10px] text-[#6B6B6B] font-medium mt-0.5 leading-snug">
          You can adjust {formatCurrency(adjustableAmount, currency)} without payment.
        </span>
      </div>
      <button
        type="button"
        onClick={onAdjustClick}
        className="shrink-0 px-3 py-2 rounded-full bg-positive text-white text-[12px] font-bold cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all outline-none border-0"
      >
        Adjust {formatCurrency(adjustableAmount, currency)}
      </button>
    </div>
  )
}
