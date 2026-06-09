import { ArrowDown, ArrowUp, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import type { BalanceSummary } from '../types'

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
    <div className="bg-white rounded-lg border-[1.08px] border-[#EFE7DD] shadow-[0px_2.69px_10.76px_0px_#0000000D] mx-6 mt-3">
      <div className="flex divide-x divide-[#EFE7DD] text-center">
        {/* Receivable Column */}
        <div className="flex-1 p-3 space-y-4">
          <p className="text-sm font-medium text-primary leading-tight">
            You will receive
          </p>
          <p className="text-[18px] font-extrabold text-primary leading-none">
            {format(totalReceivable)}
          </p>
          <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto">
            <ArrowDown size={20} className="text-primary" strokeWidth={4} />
          </div>
        </div>

        {/* Payable Column */}
        <div className="flex-1 p-3 space-y-4">
          <p className="text-sm font-medium text-[#C96A1B] leading-tight">
            You will pay
          </p>
          <p className="text-[18px] font-extrabold text-[#C96A1B] leading-none">
            {format(totalPayable)}
          </p>
          <div className="w-10 h-10 rounded-full bg-[#FFF3E6] flex items-center justify-center mx-auto">
            <ArrowUp size={20} className="text-[#C96A1B]" strokeWidth={4} />
          </div>
        </div>

        {/* Net Balance Column */}
        <div className="flex-1 p-3 space-y-4">
          <p className="text-sm font-medium text-foreground leading-tight">
            Net balance
          </p>
          <p className="text-[18px] font-extrabold text-foreground leading-none">
            {format(netBalance)}
          </p>
          <div className="w-10 h-10 rounded-full bg-[#FFF8E1] flex items-center justify-center mx-auto">
            <Wallet size={20} className="text-[#FDB105]" strokeWidth={3} />
          </div>
        </div>
      </div>
    </div>
  )
}
