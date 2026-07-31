import { useState, useMemo } from 'react'
import {
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'

interface CurrencySelectDrawerProps {
  value: string
  onChange: (value: string) => void
  className?: string
  children?: React.ReactNode
  excludeCurrencies?: string[]
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
 * CurrencySelectDrawer — A reusable dropdown/drawer currency picker.
 * Displays as a full-width pill button. On tap, triggers a Vaul bottom sheet
 * list of supported currencies sorted alphabetically with search filtering.
 */
export default function CurrencySelectDrawer({
  value,
  onChange,
  className,
  children,
  excludeCurrencies = [],
}: CurrencySelectDrawerProps) {
  const [currencySearch, setCurrencySearch] = useState('')
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false)

  // Sort currencies alphabetically by name
  const sortedCurrencies = useMemo(() => {
    const excluded = new Set(excludeCurrencies.map((code) => code.toUpperCase()))
    return [...SUPPORTED_CURRENCIES]
      .filter((currency) => !excluded.has(currency.code.toUpperCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [excludeCurrencies])

  // Filter sorted list by search query
  const filteredCurrencies = useMemo(() => {
    const query = currencySearch.trim().toLowerCase()
    if (!query) return sortedCurrencies
    return sortedCurrencies.filter(
      (cur) =>
        cur.name.toLowerCase().includes(query) ||
        cur.code.toLowerCase().includes(query)
    )
  }, [sortedCurrencies, currencySearch])

  return (
    <Drawer open={isCurrencyOpen} onOpenChange={setIsCurrencyOpen}>
      <DrawerTrigger asChild>
        {children ? (
          children
        ) : (
          <button
            type="button"
            className={cn(
              'w-full h-11 flex items-center justify-between px-4 rounded-full bg-white! border-[1.26px] border-border-card text-xs font-bold text-foreground cursor-pointer transition-all outline-none',
              className
            )}
          >
            <div className="flex items-center gap-1.5">
              <Banknote size={16} className="text-muted-foreground" />
              <span className="uppercase text-muted-foreground font-semibold">
                Currency:
              </span>
              <span className="text-foreground font-bold">
                {value.toUpperCase()}
              </span>
            </div>
            <ChevronDown size={16} className="text-muted-foreground" />
          </button>
        )}
      </DrawerTrigger>
      <DrawerContent className="bg-white rounded-t-[32px] border-t-0 p-0 flex flex-col focus:outline-none overflow-hidden text-foreground h-[65dvh] max-h-[65dvh]">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-[19px] font-extrabold text-foreground">
            Select Currency
          </h2>
          <DrawerClose asChild>
            <button
              type="button"
              className="size-8 rounded-full bg-[#0000000A] text-foreground flex items-center justify-center cursor-pointer hover:bg-muted/40 transition-all border-0 focus:outline-none"
            >
              <X size={16} className="text-muted-foreground" />
            </button>
          </DrawerClose>
        </div>

        <hr className="border-border-card border-b-[1.26px] w-full" />

        {/* Search Input */}
        <div className="relative mx-5 my-4 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0] pointer-events-none size-4" />
          <Input
            type="search"
            placeholder="Search currency..."
            value={currencySearch}
            onChange={(e) => setCurrencySearch(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-md bg-hover-bg border-[1.5px] border-divider text-sm text-foreground placeholder:text-muted-faint focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all outline-none"
          />
        </div>

        {/* Currency List */}
        <RadioGroup
          value={value.toLowerCase()}
          onValueChange={(val) => {
            onChange(val.toLowerCase())
            setIsCurrencyOpen(false)
            setCurrencySearch('')
          }}
          className="overflow-y-auto divide-y-[1.5px]! divide-divider pb-8 gap-0"
        >
          {filteredCurrencies.map((cur) => {
            const isSelected = value.toLowerCase() === cur.code.toLowerCase()
            const visuals = CURRENCY_VISUALS[cur.code.toLowerCase()] || {
              circleText: cur.code,
              circleBg: 'bg-primary',
              subText: `${cur.code} · ${cur.symbol}`,
            }

            return (
              <label
                key={cur.code}
                htmlFor={cur.code}
                className="w-full cursor-pointe h-fit"
              >
                <Item
                  className={cn(
                    'flex items-center justify-between py-3.5 px-4 transition-colors rounded-none border-0',
                    isSelected ? 'bg-[#E5F2EB]' : 'hover:bg-muted/10',
                  )}
                >
                  <ItemMedia>
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0',
                        visuals.circleBg,
                      )}
                    >
                      {visuals.circleText}
                    </div>
                  </ItemMedia>
                  <ItemContent className="text-left ml-3">
                    <ItemTitle
                      className={cn(
                        'font-bold text-[14px] leading-snug',
                        isSelected ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      {cur.name}
                    </ItemTitle>
                    <ItemDescription className="text-[11px] text-muted-faint mt-0.5 font-medium leading-none">
                      {visuals.subText}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <RadioGroupItem
                      value={cur.code.toLowerCase()}
                      id={cur.code}
                      className={cn(
                        "w-6 h-6 border-[1.5px] border-muted-foreground/30 shrink-0",
                        "data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      )}
                    />
                  </ItemActions>
                </Item>
              </label>
            )
          })}
          {filteredCurrencies.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              No currencies found.
            </p>
          )}
        </RadioGroup>
      </DrawerContent>
    </Drawer>
  )
}
