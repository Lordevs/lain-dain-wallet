import { ArrowDown, ArrowUp, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import CompactAmount from '@/components/shared/compact-amount'
import type { BalanceSummary } from '@/types'

interface BalanceSummaryCardProps {
  summary: BalanceSummary
}

/**
 * BalanceSummaryCard — displays the 3-column balance overview:
 * "You will receive" | "You will pay" | "Net balance"
 */
export default function BalanceSummaryCard({ summary }: BalanceSummaryCardProps) {
  const { totalReceivable, totalPayable, netBalance, currency } = summary

  return (
    <div className="mx-6 mt-3 shrink-0 rounded-lg border-[1.08px] border-border-card bg-white shadow-[0px_2.69px_10.76px_0px_#0000000D]">
      <div className="flex divide-x divide-border-card text-center">
        {/* Receivable Column */}
        <div className="flex-1 py-3 px-1 sm:px-2 space-y-3 min-w-0">
          <p className="text-xs font-normal text-primary leading-tight truncate">
            You will receive
          </p>
          <p className="flex items-center justify-center text-[15px] sm:text-[18px] font-extrabold text-primary leading-none">
            <CompactAmount amount={totalReceivable} currency={currency} drawerTitle="You Will Receive" />
          </p>
          <div className="w-10 h-10 rounded-full bg-positive-soft-bg flex items-center justify-center mx-auto">
            <ArrowDown size={20} className="text-primary" strokeWidth={4} />
          </div>
        </div>

        {/* Payable Column */}
        <div className="flex-1 py-3 px-1 sm:px-2 space-y-3 min-w-0">
          <p className="text-xs font-normal text-orange-payable leading-tight truncate">
            You will pay
          </p>
          <p className="flex items-center justify-center text-[15px] sm:text-[18px] font-extrabold text-orange-payable leading-none">
            <CompactAmount amount={totalPayable} currency={currency} drawerTitle="You Will Pay" />
          </p>
          <div className="w-10 h-10 rounded-full bg-orange-soft-bg flex items-center justify-center mx-auto">
            <ArrowUp size={20} className="text-orange-payable" strokeWidth={4} />
          </div>
        </div>

        {/* Net Balance Column */}
        <div className="flex-1 py-3 px-1 sm:px-2 space-y-3 min-w-0">
          <p className="text-xs font-normal text-foreground leading-tight truncate">
            Net balance
          </p>
          <p className={cn(
            "flex items-center justify-center text-[15px] sm:text-[18px] font-extrabold leading-none",
            netBalance > 0 ? "text-positive" : netBalance < 0 ? "text-orange-payable" : "text-foreground"
          )}>
            <CompactAmount amount={netBalance} currency={currency} drawerTitle="Net Balance" />
          </p>
          <div className="w-10 h-10 rounded-full bg-[#FFF8E1] flex items-center justify-center mx-auto">
            <Wallet size={20} className="text-secondary" strokeWidth={3} />
          </div>
        </div>
      </div>
    </div>
  )
}
