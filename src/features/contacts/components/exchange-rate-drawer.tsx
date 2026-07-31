import { useState } from 'react'
import { ArrowRightLeft, X } from 'lucide-react'
import { Drawer, DrawerClose, DrawerContent, DrawerHeader } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import FormError from '@/components/shared/form-error'

interface ExchangeRateDrawerProps {
  isOpen: boolean
  onClose: () => void
  ledgerCurrency: string
  otherCurrency: string
  currentRate?: string | null
  isSubmitting: boolean
  error?: string | null
  onConfirm: (rate: string) => void
}

export default function ExchangeRateDrawer({
  isOpen,
  onClose,
  ledgerCurrency,
  otherCurrency,
  currentRate,
  isSubmitting,
  error,
  onConfirm,
}: ExchangeRateDrawerProps) {
  const [rate, setRate] = useState(currentRate ?? '')

  const canSubmit = Number(rate) > 0 && !isSubmitting

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white rounded-t-[32px] pb-9 border-t-0 h-auto max-h-[90vh]">
        <DrawerHeader className="flex-row items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-[17px] font-bold text-foreground text-left">Update exchange rate</h3>
          <DrawerClose asChild>
            <button
              type="button"
              className="size-9 rounded-full bg-[#F5F5F5] text-muted-foreground flex items-center justify-center cursor-pointer active:scale-95 transition-all outline-none border-0"
              aria-label="Close"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </DrawerClose>
        </DrawerHeader>
        <hr className="border-divider border-b-[0.8px] w-full" />

        <div className="flex flex-col px-6 pt-6 gap-6">
          <div className="bg-[#EAF5EF] border border-[#0B683A26] rounded-[20px] p-5 text-left">
            <div className="flex items-center gap-2 text-positive">
              <ArrowRightLeft size={18} strokeWidth={2.4} />
              <h4 className="text-[15px] font-bold">Different currencies</h4>
            </div>
            <p className="text-[14px] text-muted-foreground leading-relaxed mt-2">
              This ledger records amounts in <strong className="text-foreground">{ledgerCurrency}</strong>.
              Update how it converts to <strong className="text-foreground">{otherCurrency}</strong>.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">
              Exchange rate
            </h4>
            <div className="flex items-center gap-3 bg-white border border-[#E8E4DC] rounded-[16px] px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
              <span className="text-[15px] font-semibold text-foreground shrink-0">
                1 {otherCurrency} =
              </span>
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                placeholder="0.00"
                className="border border-[#E8E4DC] rounded-[10px] shadow-none h-9 text-[15px] font-semibold text-right focus-visible:ring-0"
              />
              <span className="text-[15px] font-semibold text-muted-foreground shrink-0">
                {ledgerCurrency}
              </span>
            </div>
          </div>

          <FormError message={error} />

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onConfirm(rate)}
            className="w-full h-14 bg-positive text-white rounded-full font-bold text-[17px] flex items-center justify-center active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 border-0"
          >
            {isSubmitting ? 'Updating…' : 'Update rate'}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
