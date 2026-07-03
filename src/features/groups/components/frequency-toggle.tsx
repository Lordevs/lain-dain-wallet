import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export type RecurringFrequency = 'Monthly' | 'Weekly'

interface FrequencyToggleProps {
  frequency: RecurringFrequency
  onChange: (frequency: RecurringFrequency) => void
}

/** Monthly / Weekly toggle for a recurring payment's billing cadence. */
export default function FrequencyToggle({ frequency, onChange }: FrequencyToggleProps) {
  return (
    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => onChange('Monthly')}
        className={cn(
          "flex-1 py-3 rounded-[16px] text-[14px] font-bold transition-all cursor-pointer outline-none flex items-center justify-center gap-2 h-12 border",
          frequency === 'Monthly'
            ? "bg-positive-soft-bg border-positive/30 text-positive"
            : "bg-transparent border-divider text-muted-foreground"
        )}
      >
        <RefreshCw size={14} className={frequency === 'Monthly' ? "text-positive" : "text-muted-foreground"} />
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange('Weekly')}
        className={cn(
          "flex-1 py-3 rounded-[16px] text-[14px] font-bold transition-all cursor-pointer outline-none flex items-center justify-center gap-2 h-12 border",
          frequency === 'Weekly'
            ? "bg-positive-soft-bg border-positive/30 text-positive"
            : "bg-transparent border-divider text-muted-foreground"
        )}
      >
        {frequency === 'Weekly' && <RefreshCw size={14} className="text-positive" />}
        Weekly
      </button>
    </div>
  )
}
