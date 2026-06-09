import { Coffee, Fuel, ShoppingCart, Truck, Layers, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

export type ExpenseCategory = 'food' | 'fuel' | 'shopping' | 'transport' | 'other'

export interface ExpenseItemProps {
  name: string
  subtitle: string
  amount: number
  currency?: string
  category?: ExpenseCategory
  amountColor?: 'green' | 'orange' | 'black' | 'default'
  showChevron?: boolean
  onClick?: () => void
  className?: string
}

const CATEGORY_VISUALS = {
  food: {
    icon: <Coffee size={24} className="text-[#C93B2B]" />,
    bgClass: 'bg-[#FFEBEB]',
  },
  fuel: {
    icon: <Fuel size={24} className="text-[#C96A1B]" />,
    bgClass: 'bg-[#FFF3E6]',
  },
  shopping: {
    icon: <ShoppingCart size={24} className="text-[#0B683A]" />,
    bgClass: 'bg-[#ECF6F0]',
  },
  transport: {
    icon: <Truck size={24} className="text-[#1F618D]" />,
    bgClass: 'bg-[#E3F2FD]',
  },
  other: {
    icon: <Layers size={24} className="text-[#9A9590]" />,
    bgClass: 'bg-[#F5F3ED]',
  },
} as const

/**
 * ExpenseItem — A highly reusable row displaying an expense transaction.
 * Supports dynamic icon categories, custom text color overrides, positive/negative sign layouts,
 * and handles interactive chevron toggles.
 */
export default function ExpenseItem({
  name,
  subtitle,
  amount,
  currency = 'PKR',
  category = 'other',
  amountColor = 'default',
  showChevron = true,
  onClick,
  className,
}: ExpenseItemProps) {
  const { icon, bgClass } = CATEGORY_VISUALS[category] || CATEGORY_VISUALS.other

  // Resolve text color for the amount
  const colorClass = cn(
    amountColor === 'green' && 'text-[#0B683A]',
    amountColor === 'orange' && 'text-[#C96A1B]',
    amountColor === 'black' && 'text-[#1A1A1A]',
    amountColor === 'default' && (
      amount > 0 ? 'text-[#0B683A]' : amount < 0 ? 'text-[#C96A1B]' : 'text-[#1A1A1A]'
    )
  )

  let formattedAmount = formatCurrency(Math.abs(amount), currency)
  if (currency.toUpperCase() === 'PKR') {
    formattedAmount = formattedAmount.replace('₨', 'Rs.')
  }
  const displayAmount = `${amount < 0 ? '-' : ''}${formattedAmount}`

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between p-4 bg-white hover:bg-muted/5 transition-all',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Left side details */}
      <div className="flex items-center gap-3">
        <div className={cn('w-12 h-12 rounded-[13px] flex items-center justify-center shrink-0', bgClass)}>
          {icon}
        </div>
        <div>
          <p className="font-bold text-[15px] text-[#1A1A1A] leading-tight">
            {name}
          </p>
          <p className="text-[12px] text-[#6B6B6B] mt-1 font-normal leading-none">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right side amount + chevron */}
      <div className="flex items-center gap-2">
        <span className={cn('text-[16px] font-extrabold', colorClass)}>
          {displayAmount}
        </span>
        {showChevron && <ChevronRight size={16} className="text-[#EBEBEB]" />}
      </div>
    </div>
  )
}
