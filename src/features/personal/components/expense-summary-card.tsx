import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import coinWalletSvg from '@/assets/coin-wallet.svg'
import type { MonthlyExpenseSummary } from '../types'

interface ExpenseSummaryCardProps {
  summary: MonthlyExpenseSummary
  /** Defaults to "You spent this month" — callers with a different period
   * label (e.g. a custom period range) can override it. */
  label?: string
}

/**
 * ExpenseSummaryCard — Displays monthly expenses overall statistics.
 * Formats currency dynamically and renders inline spent badges with trend symbols.
 */
export default function ExpenseSummaryCard({ summary, label = 'You spent this month' }: ExpenseSummaryCardProps) {
  const { totalSpent, currency, comparison } = summary

  const format = (amount: number) => formatCurrency(amount, currency)

  return (
    <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] shadow-[0px_2px_10px_0px_#0000000D] p-6 mx-6 mt-3 flex justify-between items-center">
      <div className="flex flex-col">
        <span className="text-[#6B6B6B] text-sm font-medium">
          {label}
        </span>
        <span className="text-[38px] font-black text-[#1A1A1A] leading-none mt-2">
          {format(totalSpent)}
        </span>
        {comparison && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FFF9E6] rounded-full mt-3 w-fit">
            {comparison.direction === 'up' ? (
              <TrendingUp size={14} className="text-tertiary" strokeWidth={2.5} />
            ) : (
              <TrendingDown size={14} className="text-positive" strokeWidth={2.5} />
            )}
            <span className="text-tertiary text-xs font-semibold">
              {format(comparison.amount)} {comparison.direction === 'up' ? 'more' : 'less'} than{' '}
              {comparison.previousPeriodLabel}
            </span>
          </div>
        )}
      </div>
      <img src={coinWalletSvg} alt="Wallet" className="w-20 h-[70px] shrink-0" />
    </div>
  )
}
