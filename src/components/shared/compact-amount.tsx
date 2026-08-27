import { useState } from 'react'
import { Info, X } from 'lucide-react'
import { formatCurrency, formatCompact, formatCompactNumber, getCurrency } from '@/lib/currency'
import { Drawer, DrawerContent, DrawerHeader, DrawerClose } from '@/components/ui/drawer'
import { cn } from '@/lib/utils'

interface CompactAmountProps {
  amount: number
  currency: string
  className?: string
  drawerTitle?: string
  /** Places the currency symbol above the numeric value for narrow cards. */
  stackCurrency?: boolean
}

/**
 * CompactAmount — renders a currency amount, switching to an abbreviated
 * "20K"/"1.5M"/"5.05B" form with an info icon once the full formatted
 * string would run past ~12 characters; tapping the icon opens a bottom
 * drawer showing the exact amount. Extracted from expense-summary-card.tsx
 * (Personal screen / View Reports) so BalanceSummaryCard's three columns
 * can each opt in independently.
 */
export default function CompactAmount({ amount, currency, className, drawerTitle = 'Exact Amount', stackCurrency = false }: CompactAmountProps) {
  const [exactAmountOpen, setExactAmountOpen] = useState(false)

  const formatted = formatCurrency(amount, currency)
  const isLargeAmount = formatted.length > 12
  const display = isLargeAmount ? formatCompact(amount, currency) : formatted
  const currencySymbol = getCurrency(currency).symbol
  const numericDisplay = isLargeAmount
    ? formatCompactNumber(amount)
    : formatted.replace(/^[^\d‑-]+/, '')

  return (
    <>
      <span className={cn('inline-flex items-center gap-1.5 min-w-0', className)}>
        {stackCurrency ? (
          <span className="flex min-w-0 flex-col leading-none">
            <span className="text-[0.55em] leading-none">{currencySymbol}</span>
            <span className="truncate">{numericDisplay}</span>
          </span>
        ) : <span className="truncate">{display}</span>}
        {isLargeAmount && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setExactAmountOpen(true)
            }}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-muted-foreground cursor-pointer active:scale-90 transition-transform border-0"
            aria-label="Show exact amount"
          >
            <Info size={12} strokeWidth={2.5} />
          </button>
        )}
      </span>

      {isLargeAmount && (
        <Drawer open={exactAmountOpen} onOpenChange={setExactAmountOpen}>
          <DrawerContent className="bg-white rounded-t-[32px] pb-8 border-t-0 text-foreground outline-none">
            <DrawerHeader className="relative flex items-center justify-center px-14 pt-4 pb-4 shrink-0 text-center">
              <h3 className="text-[17px] font-extrabold text-foreground leading-snug">{drawerTitle}</h3>
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
                {formatted}
              </span>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  )
}
