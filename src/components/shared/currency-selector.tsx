import { useState, useMemo } from 'react'
import {
  Check,
  Banknote,
  Search,
  ChevronDown,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
} from '@/components/ui/drawer'
import { cn } from '@/lib/utils'
import { SUPPORTED_CURRENCIES } from '@/types'

interface CurrencySelectorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

interface CurrencyVisuals {
  circleText: string
  circleBg: string
  subText: string
}

const CURRENCY_VISUALS: Record<string, CurrencyVisuals> = {
  pkr: {
    circleText: 'Rs',
    circleBg: 'bg-[#01592B]',
    subText: 'PKR · Rs.',
  },
  usd: {
    circleText: '$',
    circleBg: 'bg-[#005227]',
    subText: 'USD · $',
  },
  eur: {
    circleText: '€',
    circleBg: 'bg-[#0033A0]',
    subText: 'EUR · €',
  },
  gbp: {
    circleText: '£',
    circleBg: 'bg-[#3A1E6A]',
    subText: 'GBP · £',
  },
  sar: {
    circleText: 'ر.س',
    circleBg: 'bg-[#D2143A]',
    subText: 'SAR · ﷼',
  },
  aed: {
    circleText: 'AED',
    circleBg: 'bg-[#1F618D]',
    subText: 'AED · د.إ',
  },
}

/**
 * CurrencySelector — A reusable dropdown/drawer currency picker.
 * Displays as a full-width pill button. On tap, triggers a Vaul bottom sheet
 * list of supported currencies sorted alphabetically with search filtering.
 */
export default function CurrencySelector({
  value,
  onChange,
  className,
}: CurrencySelectorProps) {
  const [currencySearch, setCurrencySearch] = useState('')
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false)

  // Sort currencies alphabetically by name
  const sortedCurrencies = useMemo(() => {
    return [...SUPPORTED_CURRENCIES].sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  // Filter sorted list by search query
  const filteredCurrencies = useMemo(() => {
    const query = currencySearch.trim().toLowerCase()
    if (!query) return sortedCurrencies
    return sortedCurrencies.filter(
      (cur) =>
        cur.name.toLowerCase().includes(query) ||
        cur.code.toLowerCase().includes(query),
    )
  }, [sortedCurrencies, currencySearch])

  const activeCurrency = useMemo(() => {
    return SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === value.toUpperCase())
  }, [value])

  return (
    <Drawer open={isCurrencyOpen} onOpenChange={setIsCurrencyOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className={cn(
            'w-full h-12! rounded-full bg-white! border-[1.26px] border-[#EFE7DD] font-semibold text-sm px-5 mb-4 shrink-0 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all flex justify-between items-center select-none cursor-pointer',
            className,
          )}
        >
          <div className="flex items-center gap-2">
            <Banknote className="size-5 text-[#9A9590] shrink-0" />
            <span className="text-[#6B6B6B] font-medium">{activeCurrency?.name ?? 'Pakistani Rupee'}</span>
          </div>
          <ChevronDown className="pointer-events-none size-4 text-[#9A9590]" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="bg-white rounded-t-[32px] border-t-0 p-0 flex flex-col max-h-[85vh] focus:outline-none overflow-hidden">
        {/* Custom beige drag handle */}
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-[#D4CFC8]" />

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3">
          <h3 className="text-xl font-bold text-[#2C2C2C]">Currency</h3>
          <DrawerClose asChild>
            <button
              type="button"
              className="size-8 rounded-full bg-[#0000000A] text-foreground flex items-center justify-center cursor-pointer hover:bg-muted/40 transition-all border-0 focus:outline-none"
            >
              <X size={16} className="text-[#6B6B6B]" />
            </button>
          </DrawerClose>
        </div>

        <hr className="border-[#EFE7DD] border-b-[1.26px] w-full" />

        {/* Search Input */}
        <div className="relative mx-6 my-4 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9590] pointer-events-none size-4" />
          <Input
            type="search"
            placeholder="Search currency..."
            value={currencySearch}
            onChange={(e) => setCurrencySearch(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-xl bg-[#F5F3ED] border-0 text-sm text-foreground placeholder:text-[#9A9590] focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all outline-none"
          />
        </div>

        {/* Currency List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#EFE7DD]/60 px-6 pb-8">
          {filteredCurrencies.map((cur) => {
            const isSelected = value.toLowerCase() === cur.code.toLowerCase()
            const visuals = CURRENCY_VISUALS[cur.code.toLowerCase()] || {
              circleText: cur.code,
              circleBg: 'bg-primary',
              subText: `${cur.code} · ${cur.symbol}`,
            }

            return (
              <button
                key={cur.code}
                type="button"
                onClick={() => {
                  onChange(cur.code.toLowerCase())
                  setIsCurrencyOpen(false)
                  setCurrencySearch('')
                }}
                className={cn(
                  'w-full flex items-center justify-between py-3.5 px-4 text-left transition-colors focus:outline-none border-0 cursor-pointer',
                  isSelected ? 'bg-[#E5F2EB]' : 'hover:bg-muted/10',
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Circle icon */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0',
                      visuals.circleBg,
                    )}
                  >
                    {visuals.circleText}
                  </div>
                  {/* Currency texts */}
                  <div>
                    <p
                      className={cn(
                        'font-bold text-[14px]',
                        isSelected ? 'text-[#01592B]' : 'text-foreground',
                      )}
                    >
                      {cur.name}
                    </p>
                    <p className="text-[11px] text-[#9A9590] mt-0.5 font-medium">
                      {visuals.subText}
                    </p>
                  </div>
                </div>

                {/* Radio check badge */}
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all',
                    isSelected
                      ? 'bg-[#01592B] border-[#01592B] text-white'
                      : 'border-[#D4CFC8] bg-transparent',
                  )}
                >
                  {isSelected && <Check size={12} strokeWidth={4} className="stroke-white" />}
                </div>
              </button>
            )
          })}
          {filteredCurrencies.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              No currencies found.
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
