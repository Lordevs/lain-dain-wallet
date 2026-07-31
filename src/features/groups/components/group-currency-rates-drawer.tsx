import { useMemo, useState } from 'react'
import { ArrowRightLeft, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Drawer, DrawerContent, FULLSCREEN_DRAWER_CN } from '@/components/ui/drawer'
import CurrencySelectDrawer from '@/components/shared/currency-select-drawer'
import FormError from '@/components/shared/form-error'
import CurrencyRateFields from './currency-rate-fields'
import {
  useRemoveGroupCurrencyRateMutation,
  useSetGroupCurrencyRateMutation,
} from '../api/use-group-currency-rate-mutations'
import { SUPPORTED_CURRENCIES } from '@/types'
import type { components } from '@/lib/api/schema'

type Group = components['schemas']['Group']

interface GroupCurrencyRatesDrawerProps {
  isOpen: boolean
  onClose: () => void
  group: Group
  canManage: boolean
}

export default function GroupCurrencyRatesDrawer({
  isOpen,
  onClose,
  group,
  canManage,
}: GroupCurrencyRatesDrawerProps) {
  const firstForeignCurrency =
    SUPPORTED_CURRENCIES.find((currency) => currency.code !== group.default_currency)?.code
    ?? 'USD'
  const [selectedCurrency, setSelectedCurrency] = useState(firstForeignCurrency)
  const [rateValues, setRateValues] = useState<Record<string, string>>({})
  const [isEditing, setIsEditing] = useState(false)

  const setRateMutation = useSetGroupCurrencyRateMutation(group.id)
  const removeRateMutation = useRemoveGroupCurrencyRateMutation(group.id)
  const activeRates = group.currency_rates

  const selectedRate = useMemo(
    () => activeRates.find((rate) => rate.currency === selectedCurrency.toUpperCase()),
    [activeRates, selectedCurrency],
  )

  const startAdd = () => {
    setSelectedCurrency(firstForeignCurrency)
    setRateValues({})
    setIsEditing(true)
  }

  const startEdit = (currency: string, rate: string) => {
    setSelectedCurrency(currency)
    setRateValues({ [currency]: rate })
    setIsEditing(true)
  }

  const handleCurrencyChange = (currency: string) => {
    const code = currency.toUpperCase()
    const existing = activeRates.find((rate) => rate.currency === code)
    setSelectedCurrency(code)
    setRateValues(existing ? { [code]: existing.rate } : {})
  }

  const handleSave = async () => {
    const currency = selectedCurrency.toUpperCase()
    const rate = rateValues[currency]
    if (!rate || Number(rate) <= 0) return
    await setRateMutation.mutateAsync({ currency, rate })
    setIsEditing(false)
    setRateValues({})
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className={FULLSCREEN_DRAWER_CN}>
        <div className="min-h-0 flex-1 flex flex-col bg-[#FEFAF1] text-foreground">
          <header className="relative flex items-center justify-center px-6 pt-5 pb-4">
            <button
              type="button"
              onClick={onClose}
              className="absolute left-6 size-9 rounded-full bg-white border border-divider flex items-center justify-center cursor-pointer"
              aria-label="Close currency settings"
            >
              <X size={17} />
            </button>
            <h2 className="text-lg font-extrabold">Currency & rates</h2>
          </header>

          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <div className="rounded-[24px] border border-[#B9DBCF] bg-[#E7F3EE] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#5F756A]">
                Group currency
              </p>
              <div className="flex items-end justify-between mt-2">
                <strong className="text-[28px] leading-none text-positive">
                  {group.default_currency}
                </strong>
                <span className="text-[12px] font-semibold text-[#5F756A]">Cannot be changed</span>
              </div>
              <p className="text-[12px] leading-relaxed text-[#5F756A] mt-3">
                Every group expense is recorded in this currency. Rates convert members’ own currencies for balances and reports.
              </p>
            </div>

            <div className="flex items-center justify-between mt-7 mb-3">
              <div>
                <h3 className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#6B6B6B]">
                  Exchange rates
                </h3>
                <p className="text-[11px] text-[#8A8783] mt-0.5">
                  Required before inviting a member who uses another currency
                </p>
              </div>
              {canManage && !isEditing && (
                <button
                  type="button"
                  onClick={startAdd}
                  className="size-10 rounded-full bg-positive text-white flex items-center justify-center border-0 cursor-pointer active:scale-95"
                  aria-label="Add exchange rate"
                >
                  <Plus size={18} strokeWidth={2.7} />
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="rounded-[24px] border border-[#E7E4DE] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
                <CurrencySelectDrawer
                  value={selectedCurrency}
                  onChange={handleCurrencyChange}
                  excludeCurrencies={[group.default_currency]}
                />
                <div className="mt-4">
                  <CurrencyRateFields
                    baseCurrency={group.default_currency}
                    currencies={[selectedCurrency]}
                    values={rateValues}
                    onChange={(currency, rate) => {
                      setRateValues((current) => ({ ...current, [currency]: rate }))
                    }}
                  />
                </div>
                <FormError message={setRateMutation.error?.message} className="mt-3" />
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="h-12 rounded-full bg-[#F1EFEA] text-[#5D5955] font-bold border-0 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      setRateMutation.isPending
                      || Number(rateValues[selectedCurrency.toUpperCase()] ?? 0) <= 0
                    }
                    onClick={handleSave}
                    className="h-12 rounded-full bg-positive text-white font-bold border-0 cursor-pointer disabled:opacity-50"
                  >
                    {setRateMutation.isPending
                      ? 'Saving…'
                      : selectedRate
                        ? 'Update rate'
                        : 'Add rate'}
                  </button>
                </div>
              </div>
            ) : activeRates.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#CBD8D1] bg-white/70 p-7 text-center">
                <ArrowRightLeft size={25} className="text-[#8DA99B] mx-auto" />
                <p className="text-[14px] font-bold text-[#3F4944] mt-3">No foreign currencies</p>
                <p className="text-[12px] text-[#77736F] mt-1">
                  Add a rate before inviting someone who uses a different currency.
                </p>
              </div>
            ) : (
              <div className="rounded-[24px] border border-[#E7E4DE] bg-white divide-y divide-[#E7E4DE] overflow-hidden">
                {activeRates.map((rate) => (
                  <div key={rate.currency} className="flex items-center gap-3 px-5 py-4">
                    <div className="size-11 rounded-[14px] bg-[#E8F4EF] text-positive flex items-center justify-center">
                      <ArrowRightLeft size={19} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-[#1A1A1A]">
                        1 {group.default_currency} = {Number(rate.rate).toLocaleString('en-US')} {rate.currency}
                      </p>
                      <p className="text-[11px] text-[#77736F] mt-0.5">
                        Applies to future entries
                      </p>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(rate.currency, rate.rate)}
                          className="size-9 rounded-full bg-[#E8F4EF] text-positive flex items-center justify-center border-0 cursor-pointer"
                          aria-label={`Edit ${rate.currency} rate`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={removeRateMutation.isPending}
                          onClick={() => removeRateMutation.mutate(rate.currency)}
                          className="size-9 rounded-full bg-[#FFF0ED] text-[#CC3428] flex items-center justify-center border-0 cursor-pointer disabled:opacity-50"
                          aria-label={`Remove ${rate.currency}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
