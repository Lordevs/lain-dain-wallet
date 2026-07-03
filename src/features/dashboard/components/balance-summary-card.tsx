import { ArrowDown, ArrowUp, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
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

  const format = (amount: number) => {
    return formatCurrency(amount, currency)
  }

  return (
    <div className="bg-white rounded-lg border-[1.08px] border-border-card shadow-[0px_2.69px_10.76px_0px_#0000000D] mx-6 mt-3">
      <div className="flex divide-x divide-border-card text-center">
        {/* Receivable Column */}
        <div className="flex-1 py-3 px-2 space-y-3">
          <p className="text-xs font-normal text-primary leading-tight">
            You will receive
          </p>
          <p className="text-[18px] font-extrabold text-primary leading-none">
            {format(totalReceivable)}
          </p>
          <div className="w-10 h-10 rounded-full bg-positive-soft-bg flex items-center justify-center mx-auto">
            <ArrowDown size={20} className="text-primary" strokeWidth={4} />
          </div>
        </div>

        {/* Payable Column */}
        <div className="flex-1 py-3 px-2 space-y-3">
          <p className="text-xs font-normal text-orange-payable leading-tight">
            You will pay
          </p>
          <p className="text-[18px] font-extrabold text-orange-payable leading-none">
            {format(totalPayable)}
          </p>
          <div className="w-10 h-10 rounded-full bg-orange-soft-bg flex items-center justify-center mx-auto">
            <ArrowUp size={20} className="text-orange-payable" strokeWidth={4} />
          </div>
        </div>

        {/* Net Balance Column */}
        <div className="flex-1 py-3 px-2 space-y-3">
          <p className="text-xs font-normal text-foreground leading-tight">
            Net balance
          </p>
          <p className="text-[18px] font-extrabold text-foreground leading-none">
            {format(netBalance)}
          </p>
          <div className="w-10 h-10 rounded-full bg-[#FFF8E1] flex items-center justify-center mx-auto">
            <Wallet size={20} className="text-secondary" strokeWidth={3} />
          </div>
        </div>
      </div>
    </div>
  )
}
