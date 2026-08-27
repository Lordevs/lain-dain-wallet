import { createElement, memo, useState } from 'react'
import { Coffee, Fuel, ShoppingCart, Truck, Handshake, Layers, ChevronRight, RefreshCw } from 'lucide-react'
import CompactAmount from './compact-amount'
import { cn } from '@/lib/utils'
import { iconForCategory } from '@/features/expenses/lib/category-icons'
import { useLongPress } from '@/hooks/use-long-press'
import { useAuthStore } from '@/store/use-auth-store'
import { haptic } from '@/lib/haptics'
import ReactionPicker from './reaction-picker'
import ReactionBadge from './reaction-badge'

export type ExpenseCategory = 'food' | 'fuel' | 'shopping' | 'transport' | 'payment' | 'adjustment' | 'other'

export interface ReactionEntry {
  id: string
  emoji: string
  full_name: string
  image: string | null
}

export interface ExpenseItemProps {
  // Threaded through so onClick can stay one stable function identity from
  // the list owner (see ExpenseList) — required for memo() below to
  // actually skip re-rendering rows whose data didn't change.
  id: string | number
  kind?: 'expense' | 'settlement'
  name: string
  subtitle: React.ReactNode
  amount: number
  currency?: string
  category?: ExpenseCategory
  categoryIcon?: string
  categoryColor?: string
  amountColor?: 'green' | 'orange' | 'black' | 'default'
  showChevron?: boolean
  rightSubtitle?: string
  onClick?: (id: string | number, kind?: 'expense' | 'settlement') => void
  // Stable identity required, same discipline as onClick — the picker's
  // own open/close state stays internal to this component below, only
  // the selection callback needs to flow up to the list owner.
  onReact?: (id: string | number, kind: 'expense' | 'settlement' | undefined, emoji: string) => void
  reactions?: ReactionEntry[]
  className?: string
  leftSlot?: React.ReactNode
}

const CATEGORY_VISUALS = {
  food: {
    icon: <Coffee size={24} className="text-[#C93B2B]" />,
    bgClass: 'bg-[#FFEBEB]',
  },
  fuel: {
    icon: <Fuel size={24} className="text-orange-payable" />,
    bgClass: 'bg-[#FFF3E6]',
  },
  shopping: {
    icon: <ShoppingCart size={24} className="text-positive" />,
    bgClass: 'bg-[#ECF6F0]',
  },
  transport: {
    icon: <Truck size={24} className="text-[#1F618D]" />,
    bgClass: 'bg-[#E3F2FD]',
  },
  payment: {
    icon: <Handshake size={24} className="text-positive" strokeWidth={2.5} />,
    bgClass: 'bg-[#B8DECA]',
  },
  // A no-money-changes-hands netting between two ledgers — visually
  // distinct from a real payment settlement so it can't be mistaken for one.
  adjustment: {
    icon: <RefreshCw size={22} className="text-[#6C4FCE]" strokeWidth={2.5} />,
    bgClass: 'bg-[#EDE7F6]',
  },
  other: {
    icon: <Layers size={24} className="text-muted-faint" />,
    bgClass: 'bg-[#F5F3ED]',
  },
} as const

/**
 * ExpenseItem — A highly reusable row displaying an expense transaction.
 * Supports dynamic icon categories, custom text color overrides, positive/negative sign layouts,
 * and handles interactive chevron toggles.
 */
function ExpenseItem({
  id,
  kind,
  name,
  subtitle,
  amount,
  currency = 'PKR',
  category = 'other',
  categoryIcon,
  categoryColor,
  amountColor = 'default',
  showChevron = true,
  rightSubtitle,
  onClick,
  onReact,
  reactions,
  className,
  leftSlot,
}: ExpenseItemProps) {
  const { icon, bgClass } = CATEGORY_VISUALS[category] || CATEGORY_VISUALS.other

  const [pickerOpen, setPickerOpen] = useState(false)
  const myId = useAuthStore((s) => s.userProfile?.id)
  const myReaction = reactions?.find((r) => r.id === myId)?.emoji ?? null

  const longPress = useLongPress({
    disabled: !onReact,
    onLongPress: () => {
      haptic.heavy()
      setPickerOpen(true)
    },
  })

  // Resolve text color for the amount
  const colorClass = category === 'payment'
    ? 'text-positive'
    : category === 'adjustment'
      ? 'text-[#6C4FCE]'
      : cn(
      amountColor === 'green' && 'text-positive',
      amountColor === 'orange' && 'text-orange-payable',
      amountColor === 'black' && 'text-foreground',
      amountColor === 'default' && (
        amount > 0 ? 'text-positive' : amount < 0 ? 'text-orange-payable' : 'text-foreground'
      )
    )


  return (
    <ReactionPicker
      open={pickerOpen}
      onOpenChange={setPickerOpen}
      activeEmoji={myReaction}
      onSelect={(emoji) => onReact?.(id, kind, emoji)}
    >
    <div
      onClick={onClick ? () => onClick(id, kind) : undefined}
      onPointerDown={longPress.onPointerDown}
      onPointerMove={longPress.onPointerMove}
      onPointerUp={longPress.onPointerUp}
      onPointerLeave={longPress.onPointerLeave}
      onClickCapture={longPress.onClickCapture}
      className={cn(
        'relative flex items-center justify-between p-4 bg-white hover:bg-muted/5 transition-all',
        // Extra bottom room so the reaction badge/default-face icon sits
        // inside this row's own box instead of spilling into the next
        // row below it.
        !!onReact && 'pb-7',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Left side details */}
      <div className="min-w-0 flex items-center gap-3">
        {leftSlot ? (
          leftSlot
        ) : categoryIcon ? (
          <div
            className="w-12 h-12 rounded-[13px] flex items-center justify-center shrink-0"
            style={{ backgroundColor: categoryColor ? `${categoryColor}1A` : undefined }}
          >
            {createElement(iconForCategory(categoryIcon), {
              size: 22,
              style: categoryColor ? { color: categoryColor } : undefined,
            })}
          </div>
        ) : (
          <div
            className={cn(
              'w-12 h-12 flex items-center justify-center shrink-0',
              category === 'payment' || category === 'adjustment' ? 'rounded-full' : 'rounded-[13px]',
              bgClass,
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className={cn(
            "font-bold text-[14px] leading-tight",
            category === 'payment' ? "text-positive" : category === 'adjustment' ? "text-[#6C4FCE]" : "text-foreground"
          )}>
            {name}
          </p>
          {subtitle && (
            <div className="text-[12px] text-muted-foreground mt-1 font-normal leading-normal whitespace-pre-line">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Right side amount + chevron */}
      <div className="w-[44%] min-w-0 shrink-0 flex items-center justify-end gap-1.5">
        <div className="min-w-0 flex flex-col items-end text-right">
          <span className={cn('text-base font-bold max-w-full', colorClass)}>
            {amount < 0 && <span>-</span>}
            <CompactAmount
              amount={Math.abs(amount)}
              currency={currency}
              drawerTitle="Exact Amount"
              className="max-w-full"
              compactThreshold={7}
            />
          </span>
          {rightSubtitle && (
            <span className="text-[11px] text-muted-foreground mt-1 font-normal leading-none">
              {rightSubtitle}
            </span>
          )}
        </div>
        {/* Always reserve the chevron's slot (visibility, not
            conditional render) so the amount column lines up on the same
            right edge across rows regardless of showChevron — settlement
            rows without a chevron would otherwise sit ~24px further
            right than expense rows next to them in the same card. */}
        <ChevronRight size={16} className={cn('text-divider', !showChevron && 'invisible')} />
      </div>

      {onReact && (
        <ReactionBadge
          reactions={reactions ?? []}
          onOpenPicker={() => setPickerOpen(true)}
        />
      )}
    </div>
    </ReactionPicker>
  )
}

export default memo(ExpenseItem)
