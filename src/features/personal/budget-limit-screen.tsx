import { useState } from 'react'
import { Info } from 'lucide-react'
import { usePersonalExpenseSettingsQuery } from '@/features/expenses/api/use-personal-expense-settings-query'
import { useUpdatePersonalExpenseSettingsMutation } from '@/features/expenses/api/use-update-personal-expense-settings-mutation'
import { useMyExpensesSummaryQuery } from '@/features/expenses/api/use-my-expenses-summary-query'
import { formatCurrency } from '@/lib/currency'
import FlowHeader from '@/components/shared/flow-header'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function getOrdinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default function BudgetLimitScreen() {
  const settingsQuery = usePersonalExpenseSettingsQuery()

  if (settingsQuery.isLoading || !settingsQuery.data) {
    return (
      <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none overflow-hidden text-[#1A1A1A]">
        <FlowHeader title="Monthly Budget Limit" backVariant="circle" />
        <div className="flex-1 px-6 pb-28 flex flex-col gap-5 mt-2">
          <div className="flex items-center gap-4">
            <Skeleton className="flex-1 h-24 rounded-[20px]" />
            <Skeleton className="flex-1 h-24 rounded-[20px]" />
          </div>
          <Skeleton className="h-96 rounded-[24px]" />
        </div>
      </div>
    )
  }

  // Mounted only once real data exists, so its own useState lazy
  // initializers pick up the real values on first render — no effect
  // needed to "sync" them in afterward.
  return (
    <BudgetLimitForm
      periodStartDay={settingsQuery.data.period_start_day}
      initialLimit={settingsQuery.data.monthly_budget_limit ? Number(settingsQuery.data.monthly_budget_limit) : 0}
      initialThreshold={settingsQuery.data.budget_alert_threshold_percent}
    />
  )
}

function BudgetLimitForm({
  periodStartDay,
  initialLimit,
  initialThreshold,
}: {
  periodStartDay: number
  initialLimit: number
  initialThreshold: number
}) {
  const updateSettings = useUpdatePersonalExpenseSettingsMutation()
  const summaryQuery = useMyExpensesSummaryQuery()

  const [limitValue, setLimitValue] = useState(initialLimit)
  const [thresholdValue, setThresholdValue] = useState(initialThreshold)

  const handleSave = () => {
    updateSettings.mutate(
      {
        monthly_budget_limit: limitValue > 0 ? limitValue.toFixed(2) : null,
        budget_alert_threshold_percent: thresholdValue,
      },
      { onSuccess: () => window.history.back() },
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '')
    setLimitValue(rawVal ? Number(rawVal) : 0)
  }

  const budgetPresets = [
    { label: '20k', value: 20000 },
    { label: '30k', value: 30000 },
    { label: '50k', value: 50000 },
    { label: '75k', value: 75000 },
    { label: '100k', value: 100000 },
  ]

  const thresholdPresets = [70, 80, 90]

  const currency = summaryQuery.data?.currency ?? 'PKR'
  const spentThisMonth = summaryQuery.data ? Number(summaryQuery.data.spent) : null

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none overflow-hidden text-[#1A1A1A]">
      {/* Top Header */}
      <FlowHeader
        title="Monthly Budget Limit"
        backVariant="circle"
        rightSlot={
          <button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="text-positive font-bold text-base bg-transparent border-0 cursor-pointer outline-none hover:opacity-85 disabled:opacity-50"
          >
            Save
          </button>
        }
      />

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto px-6 pb-28 flex flex-col gap-5 mt-2">
        {/* Two Stats Cards */}
        <div className="flex items-center gap-4">
          {/* Spent this month */}
          <div className="flex-1 bg-white border border-[#EBEBEB] rounded-[20px] p-[18px] flex flex-col text-left shadow-[0px_2px_8px_0px_#00000005]">
            <span className="text-[12px] font-semibold text-[#6B6B6B]">
              Spent this month
            </span>
            {spentThisMonth === null ? (
              <Skeleton className="h-6 w-20 mt-2" />
            ) : (
              <span className="text-[20px] font-extrabold text-[#1A1A1A] mt-2 leading-none tracking-tight">
                {formatCurrency(spentThisMonth, currency)}
              </span>
            )}
          </div>

          {/* Budget Limit Status */}
          <div className="flex-1 bg-[#E4F2EB] border-[1.5px] border-[#0B683A26] rounded-[20px] p-[18px] flex flex-col text-left shadow-[0px_2px_8px_0px_#00000005]">
            <span className="text-[12px] font-semibold text-[#6B6B6B]">
              Budget limit
            </span>
            <span className="text-[20px] font-extrabold text-positive mt-2 leading-none tracking-tight">
              {limitValue > 0 ? formatCurrency(limitValue, currency) : 'Not set'}
            </span>
          </div>
        </div>

        {/* Set Your Limit Section */}
        <div className="flex flex-col text-left">
          <h4 className="text-[11px] font-semibold text-[#6B6B6B] tracking-[0.8px] mb-2 px-1 uppercase">
            Set your limit
          </h4>
          <div className="bg-white border-[1.5px] border-[#EBEBEB] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">

            {/* Amount input block matching AddExpenseBase style */}
            <div className="flex border-b-[1.5px] border-[#EBEBEB] h-18 items-stretch">
              <div className="flex items-center justify-center bg-[#FFF9E6] px-5 border-r-[1.5px] border-[#EBEBEB] select-none shrink-0">
                <span className="text-base font-extrabold text-[#C96A1B] leading-none">
                  Rs.
                </span>
              </div>
              <div className="flex-1 flex items-center px-4 relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={limitValue === 0 ? '' : limitValue.toLocaleString('en-US')}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border-0 outline-none text-[36px]! font-black text-foreground placeholder:text-divider font-sans leading-none py-1"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Slider & Presets area */}
            <div className="p-5 flex flex-col gap-5">

              {/* Slider track min-max text */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[12px] font-bold text-[#9A9590]">
                  <span>Rs. 10,000</span>
                  <span>Rs. 100,000</span>
                </div>
                <Slider
                  min={10000}
                  max={100000}
                  step={1000}
                  value={[Math.max(10000, Math.min(100000, limitValue))]}
                  onValueChange={(val) => setLimitValue(val[0])}
                  className="py-2"
                />
              </div>

              {/* Presets buttons */}
              <div className="flex items-center justify-between gap-2.5">
                {budgetPresets.map((preset) => {
                  const isSelected = limitValue === preset.value
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setLimitValue(preset.value)}
                      className={cn(
                        "flex-1 h-10 flex items-center justify-center font-semibold text-xs rounded-[10px] transition-all border outline-none cursor-pointer",
                        isSelected
                          ? "bg-[#E4F2EB] border-positive text-positive border-[1.5px]"
                          : "bg-[#F8F6F2] border-[#EBEBEB] text-[#6B6B6B] hover:bg-muted/10"
                      )}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="border-t border-[#EBEBEB]" />

            {/* Alert Threshold select row */}
            <div className="p-5 flex items-center justify-between transition-colors hover:bg-muted/5">
              <div className="flex flex-col text-left pr-4">
                <span className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">
                  Alert threshold
                </span>
                <span className="text-[12px] font-normal text-[#6B6B6B] mt-1.5 leading-normal">
                  Send alert when I've spent
                </span>
              </div>
              <div className="flex items-center gap-2">
                {thresholdPresets.map((threshold) => {
                  const isSelected = thresholdValue === threshold
                  return (
                    <button
                      key={threshold}
                      type="button"
                      onClick={() => setThresholdValue(threshold)}
                      className={cn(
                        "h-10 px-3.5 flex items-center justify-center font-bold text-xs rounded-[10px] transition-all border outline-none cursor-pointer",
                        isSelected
                          ? "bg-[#E4F2EB] border-positive text-positive border-[1.5px]"
                          : "bg-[#F8F6F2] border-[#EBEBEB] text-[#6B6B6B] hover:bg-muted/10"
                      )}
                    >
                      {threshold}%
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* About Budget Limits Banner */}
        <div className="bg-[#E4F2EB] border-[1.5px] border-[#0B683A26] rounded-[14px] p-5 text-left flex flex-col gap-2 shadow-[0px_4px_16px_rgba(0,0,0,0.01)]">
          <h4 className="text-[13px] font-bold text-positive flex items-center gap-2">
            <Info size={16} strokeWidth={2.5} className="shrink-0" />
            About budget limits
          </h4>
          <p className="text-[13px] text-[#6B6B6B] font-normal leading-relaxed">
            This limit covers all your personal expenses across groups and 1-to-1 ledgers. It resets on the{' '}
            <span className="font-bold text-positive">{getOrdinal(periodStartDay)}</span> of each month based on your default period
            setting.
          </p>
        </div>
      </div>

      {/* Fixed bottom Save Button */}
      <div className="safe-action-fixed z-10">
        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="w-full max-w-md h-14 rounded-full bg-positive hover:bg-positive/95 text-white font-bold text-base"
        >
          Save Budget Limit
        </Button>
      </div>
    </div>
  )
}
