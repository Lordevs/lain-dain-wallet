import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerClose,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from '@/components/ui/item'
import FormError from '@/components/shared/form-error'
import { getCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { CurrencyMismatch } from '../lib/parse-currency-mismatch'

interface CurrencyMismatchDrawerProps {
  isOpen: boolean
  onClose: () => void
  mismatch: CurrencyMismatch | null
  isSubmitting: boolean
  submitError: string | null
  onConfirm: (currency: string, exchangeRate: string) => void
}

/**
 * Shown when starting a 1:1 ledger with someone whose default_currency
 * differs from the current user's — services.start_friendship requires
 * picking one of the two currencies for the ledger, plus the exchange
 * rate to the other one, before it'll create the Friendship at all.
 * Same drawer chrome (rounded-t-[32px] sheet, header + X close, warning
 * box) as OutstandingBalanceDrawer/ConfirmActionDrawer elsewhere in
 * Settings — new content, not a new visual pattern.
 */
export default function CurrencyMismatchDrawer({
  isOpen,
  onClose,
  mismatch,
  isSubmitting,
  submitError,
  onConfirm,
}: CurrencyMismatchDrawerProps) {
  const [selectedCurrency, setSelectedCurrency] = useState('')
  const [rate, setRate] = useState('')

  if (!mismatch) return null

  // Falls back to the mismatch's own default rather than resetting via an
  // effect — this drawer stays mounted with isOpen toggling, so "" only
  // ever means "hasn't been touched for this mismatch yet."
  const effectiveCurrency = selectedCurrency || mismatch.yourCurrency

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
      // Clears the form on the way out — the next mismatch (any contact)
      // starts from a blank rate instead of a stale leftover value.
      setSelectedCurrency('')
      setRate('')
    }
  }

  const { yourCurrency, theirCurrency } = mismatch
  const otherCurrency = effectiveCurrency === yourCurrency ? theirCurrency : yourCurrency
  const rateValue = Number(rate)
  const canSubmit = rate.trim() !== '' && rateValue > 0

  const handleConfirm = () => {
    if (!canSubmit) return
    onConfirm(effectiveCurrency, rate)
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="bg-white rounded-t-[32px] pb-9 border-t-0 h-auto max-h-[90vh]">
        <DrawerHeader className="flex-row items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-[17px] font-bold text-foreground text-left">
            Set up this ledger's currency
          </h3>
          <DrawerClose asChild>
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-[#F5F5F5] text-muted-foreground flex items-center justify-center cursor-pointer active:scale-95 transition-all outline-none border-0 shrink-0"
              aria-label="Close"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </DrawerClose>
        </DrawerHeader>
        <hr className="border-divider border-b-[0.8px] w-full shrink-0" />

        <div className="flex flex-col px-6 pt-6 pb-2 gap-6">
          {/* Warning box — same shape as OutstandingBalanceDrawer's */}
          <div className="w-full bg-[#FFF9E6] border-[1.11px] border-[#C85A0033] rounded-[20px] p-5 text-left shadow-[0px_2px_8px_0px_rgba(253,177,5,0.03)]">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-tertiary shrink-0" />
              <h4 className="text-[15px] font-bold text-tertiary leading-none">Different currencies</h4>
            </div>
            <p className="text-[15px] text-muted-foreground font-normal leading-relaxed">
              You use <span className="font-bold text-foreground">{yourCurrency}</span>, they use{' '}
              <span className="font-bold text-foreground">{theirCurrency}</span>. Pick which currency this
              ledger tracks amounts in, and the exchange rate to the other one.
            </p>
          </div>

          {/* Currency choice */}
          <div>
            <h3 className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">Ledger currency</h3>
            <RadioGroup
              value={effectiveCurrency}
              onValueChange={setSelectedCurrency}
              className="gap-0 border-[0.8px] border-[#EBEBEB] rounded-xl bg-white shadow-[0px_2px_10px_0px_#0000000D] divide-y-[0.8px] divide-[#EBEBEB] overflow-hidden"
            >
              {[yourCurrency, theirCurrency].map((code) => {
                const isSelected = effectiveCurrency === code
                const currency = getCurrency(code)
                return (
                  <label key={code} htmlFor={`ledger-currency-${code}`} className="w-full cursor-pointer">
                    <Item
                      className={cn(
                        'flex items-center justify-between p-3.5 transition-colors rounded-none border-0',
                        isSelected ? 'bg-[#E5F2EB]' : 'hover:bg-muted/10',
                      )}
                    >
                      <ItemContent className="text-left">
                        <ItemTitle
                          className={cn('font-bold text-[14px] leading-snug', isSelected ? 'text-primary' : 'text-foreground')}
                        >
                          {code}
                        </ItemTitle>
                        <ItemDescription className="text-[11px] leading-snug mt-0.5 text-muted-foreground">
                          {currency.name}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <RadioGroupItem
                          value={code}
                          id={`ledger-currency-${code}`}
                          className="w-6 h-6 border-[1.5px] border-muted-foreground/30 shrink-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </ItemActions>
                    </Item>
                  </label>
                )
              })}
            </RadioGroup>
          </div>

          {/* Exchange rate */}
          <div>
            <h3 className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">
              Exchange rate
            </h3>
            <div className="flex items-center gap-3 bg-white border-[0.8px] border-[#E8E4DC] rounded-[16px] px-5 py-4 shadow-[0px_2px_10px_rgba(0,0,0,0.03)]">
              <span className="text-[15px] font-semibold text-foreground shrink-0">1 {otherCurrency} =</span>
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0.00"
                className="border-[0.8px] border-[#E8E4DC] rounded-[10px] shadow-none h-8 text-[15px] font-semibold text-right focus-visible:ring-0"
              />
              <span className="text-[15px] font-semibold text-muted-foreground shrink-0">{effectiveCurrency}</span>
            </div>
            <p className="text-[12px] text-muted-foreground mt-2 px-1">
              e.g. how many {effectiveCurrency} equal 1 {otherCurrency}.
            </p>
          </div>

          <FormError message={submitError} />

          {/* Bottom CTA */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canSubmit || isSubmitting}
            className="w-full h-14 bg-primary text-white rounded-full font-bold text-[17px] flex items-center justify-center active:scale-[0.99] transition-all cursor-pointer disabled:opacity-70"
          >
            {isSubmitting ? 'Starting...' : 'Confirm & Continue'}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
