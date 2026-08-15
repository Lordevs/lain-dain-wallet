import { useState } from 'react'
import { TrendingUp, TrendingDown, Info, X } from 'lucide-react'
import { formatCurrency, formatCompact } from '@/lib/currency'
import coinWalletSvg from '@/assets/coin-wallet.svg'
import { Skeleton } from '@/components/ui/skeleton'
import { Drawer, DrawerContent, DrawerHeader, DrawerClose } from '@/components/ui/drawer'
import { cn } from '@/lib/utils'
import type { MonthlyExpenseSummary } from '../types'

interface ExpenseSummaryCardProps {
  summary: MonthlyExpenseSummary
  /** Defaults to "You spent this month" — callers with a different period
   * label (e.g. a custom period range) can override it. */
  label?: string
  className?: string
}

/**
 * ExpenseSummaryCard — Displays monthly expenses overall statistics.
 * Formats currency dynamically and renders inline spent badges with trend symbols.
 */
export default function ExpenseSummaryCard({ summary, label = 'You spent this month', className }: ExpenseSummaryCardProps) {
  const { totalSpent, currency, comparison } = summary
  const [exactAmountOpen, setExactAmountOpen] = useState(false)

  const format = (amount: number) => formatCurrency(amount, currency)
  const formattedTotal = format(totalSpent)
  const isLargeAmount = formattedTotal.length > 12
  const displayTotal = isLargeAmount ? formatCompact(totalSpent, currency) : formattedTotal

  return (
    <>
    <div className={cn("bg-white rounded-[20px] border-[0.8px] border-[#EBEBEB] shadow-[0px_2px_5px_0px_#0000000D] p-4 mx-6 mt-3 flex justify-between items-center", className)}>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[#6B6B6B] text-xs font-medium">
          {label}
        </span>
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={cn(
              'whitespace-nowrap font-black leading-none tracking-[-0.04em] text-[#1A1A1A] tabular-nums',
              isLargeAmount ? 'text-[clamp(20px,7vw,28px)]' : 'text-[clamp(26px,8vw,32px)]',
            )}
          >
            {displayTotal}
          </span>
          {isLargeAmount && (
            <button
              type="button"
              onClick={() => setExactAmountOpen(true)}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-muted-foreground cursor-pointer active:scale-90 transition-transform border-0"
              aria-label="Show exact amount"
            >
              <Info size={12} strokeWidth={2.5} />
            </button>
          )}
        </div>
        {comparison && (
          <div className="mt-3 flex max-w-full items-start gap-1 rounded-xl bg-[#FFF9E6] px-2.5 py-1">
            {comparison.direction === 'up' ? (
              <TrendingUp size={12} className="text-tertiary" strokeWidth={2.5} />
            ) : (
              <TrendingDown size={12} className="text-positive" strokeWidth={2.5} />
            )}
            <span className="min-w-0 text-[10px] font-semibold leading-snug text-tertiary">
              {format(comparison.amount)} {comparison.direction === 'up' ? 'more' : 'less'} than{' '}
              {comparison.previousPeriodLabel}
            </span>
          </div>
        )}
      </div>
      <img src={coinWalletSvg} alt="" className="h-15 w-28 shrink-0" />
    </div>
    <Drawer open={exactAmountOpen} onOpenChange={setExactAmountOpen}>
      <DrawerContent className="bg-white rounded-t-[32px] pb-8 border-t-0 text-foreground outline-none">
        <DrawerHeader className="relative flex items-center justify-center px-14 pt-4 pb-4 shrink-0 text-center">
          <h3 className="text-[17px] font-extrabold text-foreground leading-snug">Exact Amount</h3>
          <DrawerClose asChild>
            <button
              type="button"
              className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#F5F5F5] text-muted-foreground flex items-center justify-center cursor-pointer active:scale-95 transition-all outline-none border-0 shrink-0"
              aria-label="Close"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </DrawerClose>
        </DrawerHeader>
        <hr className="border-divider border-b-[0.8px] w-full shrink-0" />
        <div className="px-6 py-8 text-center">
          <span className="text-2xl font-black tracking-[-0.02em] text-[#1A1A1A] tabular-nums">
            {formattedTotal}
          </span>
        </div>
      </DrawerContent>
    </Drawer>
    </>
  )
}

export function ExpenseSummaryCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white rounded-[20px] border-[0.8px] border-[#EBEBEB] shadow-[0px_2px_5px_0px_#0000000D] p-4 mx-6 mt-3 flex justify-between items-center", className)}>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-36 mt-1" />
        <Skeleton className="h-5 w-44 rounded-full mt-1" />
      </div>
      <Skeleton className="w-24 h-14 rounded-xl shrink-0" />
    </div>
  )
}

ExpenseSummaryCard.Skeleton = ExpenseSummaryCardSkeleton
