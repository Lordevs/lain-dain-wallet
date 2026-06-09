import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

interface NetBalanceCardProps {
  amount: number
  currency?: string
  label?: string        // e.g. "overall"
  description?: string  // e.g. "Net across 3 ledgers"
  className?: string
}

/**
 * NetBalanceCard — A card that displays the net balance for a contact detail screen.
 * Automatically handles currency formatting, positive/negative color styling,
 * and layouts to match design mockups.
 */
export default function NetBalanceCard({
  amount,
  currency = 'PKR',
  label = 'overall',
  description,
  className,
}: NetBalanceCardProps) {
  const isPositive = amount > 0
  const isNegative = amount < 0

  const colorClass = cn(
    isPositive && 'text-[#0B683A]',
    isNegative && 'text-[#C96A1B]',
    amount === 0 && 'text-[#1A1A1A]'
  )

  let formattedVal = formatCurrency(Math.abs(amount), currency)
  if (currency.toUpperCase() === 'PKR') {
    formattedVal = formattedVal.replace('₨', 'Rs.').replace('Rs. ', 'Rs.')
  }

  return (
    <div
      className={cn(
        'bg-white rounded-[24px] border border-[#EFE7DD] shadow-[0px_4px_16px_0px_#00000008] p-6 flex flex-col justify-center',
        className
      )}
    >
      <div className="flex items-baseline flex-wrap">
        <span className={cn('text-[32px] font-extrabold leading-none tracking-tight', colorClass)}>
          {formattedVal}
        </span>
        {label && (
          <span className="text-[#9A9590] text-[15px] font-semibold ml-2.5">
            {label}
          </span>
        )}
      </div>
      {description && (
        <p className="text-[#9A9590] text-sm font-semibold mt-3">
          {description}
        </p>
      )}
    </div>
  )
}
