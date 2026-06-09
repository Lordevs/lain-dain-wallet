import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import coinWalletSvg from '@/assets/coin-wallet.svg'
import type { MonthlyExpenseSummary } from '../types'

interface ExpenseSummaryCardProps {
  summary: MonthlyExpenseSummary
}

/**
 * ExpenseSummaryCard — Displays monthly expenses overall statistics.
 * Formats currency dynamically and renders inline spent badges with trend symbols.
 */
export default function ExpenseSummaryCard({ summary }: ExpenseSummaryCardProps) {
  const { totalSpent, currency, differenceAmount, differenceMonth } = summary

  const format = (amount: number) => formatCurrency(amount, currency)

  return (
    <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] shadow-[0px_2px_10px_0px_#0000000D] p-6 mx-6 mt-3 flex justify-between items-center">
      <div className="flex flex-col">
        <span className="text-[#6B6B6B] text-sm font-medium">
          You spent this month
        </span>
        <span className="text-5xl font-extrabold text-[#1A1A1A] leading-none mt-2">
          {format(totalSpent)}
        </span>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FFF9E6] rounded-full mt-3 w-fit">
          <TrendingUp size={14} className="text-tertiary" strokeWidth={2.5} />
          <span className="text-tertiary text-[12px] font-bold">
            {format(differenceAmount)} more than {differenceMonth}
          </span>
        </div>
      </div>
      <img src={coinWalletSvg} alt="Wallet" className="w-20 h-[70px] shrink-0" />
    </div>
  )
}
