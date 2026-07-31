import { ArrowRightLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { getCurrency } from '@/lib/currency'

interface CurrencyRateFieldsProps {
  baseCurrency: string
  currencies: string[]
  values: Record<string, string>
  onChange: (currency: string, rate: string) => void
}

/**
 * Shared rate-entry pattern for group creation, adding members, and
 * Group Settings. A rate always means foreign-currency units per one
 * unit of the group's immutable base currency.
 */
export default function CurrencyRateFields({
  baseCurrency,
  currencies,
  values,
  onChange,
}: CurrencyRateFieldsProps) {
  if (currencies.length === 0) return null

  const base = baseCurrency.toUpperCase()

  return (
    <div className="space-y-3">
      {currencies.map((currencyCode) => {
        const currency = currencyCode.toUpperCase()
        return (
          <div
            key={currency}
            className="rounded-[18px] border border-[#DDE9E3] bg-[#F5FAF7] px-4 py-3.5"
          >
            <div className="flex items-center gap-2 text-positive mb-2.5">
              <ArrowRightLeft size={15} strokeWidth={2.4} />
              <span className="text-[12px] font-bold">
                {getCurrency(currency).name}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[13px] font-bold text-[#1A1A1A] whitespace-nowrap">
                1 {base} =
              </span>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={values[currency] ?? ''}
                onChange={(event) => onChange(currency, event.target.value)}
                placeholder="0.00"
                aria-label={`${currency} exchange rate`}
                className="h-10 min-w-0 rounded-[12px] border-[#D9E4DE] bg-white text-right font-bold focus-visible:ring-positive/30"
              />
              <span className="text-[13px] font-bold text-[#6B6B6B]">{currency}</span>
            </div>
          </div>
        )
      })}
      <p className="px-1 text-[11px] leading-relaxed text-[#77736F]">
        New rates apply to future entries. Existing entries keep the rate recorded when they were created.
      </p>
    </div>
  )
}
