import { useState } from 'react'
import { Info } from 'lucide-react'
import { usePersonalExpenseSettingsQuery } from '@/features/expenses/api/use-personal-expense-settings-query'
import { useUpdatePersonalExpenseSettingsMutation } from '@/features/expenses/api/use-update-personal-expense-settings-mutation'
import FlowHeader from '@/components/shared/flow-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, getOrdinal } from '@/lib/utils'

export default function DefaultPeriodScreen() {
  const settingsQuery = usePersonalExpenseSettingsQuery()

  if (settingsQuery.isLoading || !settingsQuery.data) {
    return (
      <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none overflow-hidden text-[#1A1A1A] text-left">
        <FlowHeader title="Default Period" backVariant="circle" />
        <div className="flex-1 px-6 pb-24 flex flex-col gap-5 mt-2">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-80 rounded-[24px]" />
        </div>
      </div>
    )
  }

  // Mounted only once real data exists, so its own useState lazy
  // initializer picks up the real value on first render — no effect
  // needed to "sync" it in afterward.
  return <DefaultPeriodForm initialResetDay={settingsQuery.data.period_start_day} />
}

function DefaultPeriodForm({ initialResetDay }: { initialResetDay: number }) {
  const updateSettings = useUpdatePersonalExpenseSettingsMutation()
  const [tempResetDay, setTempResetDay] = useState(initialResetDay)

  const handleSave = () => {
    updateSettings.mutate(
      { period_start_day: tempResetDay },
      { onSuccess: () => window.history.back() },
    )
  }

  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const prevDay = tempResetDay - 1 === 0 ? 31 : tempResetDay - 1

  // "Example: 5th June -> 4th July" — the two month names are the actual
  // current/next month, so the whole example stays truthful instead of
  // permanently reading "June -> July" regardless of when it's viewed.
  const now = new Date()
  const currentMonthName = now.toLocaleDateString('en-US', { month: 'long' })
  const nextMonthName = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toLocaleDateString('en-US', { month: 'long' })

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none overflow-hidden text-[#1A1A1A] text-left">
      <FlowHeader
        title="Default Period"
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

      {/* Main Scroll Container — min-h-0 is required (not just flex-1) so
          this actually shrinks to the header's remaining space and scrolls;
          without it, some mobile browsers size it to its content instead
          and the overflow-hidden root just clips whatever doesn't fit,
          cutting the calendar/banner off instead of letting it scroll. */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-24 flex flex-col gap-5 mt-2">
        {/* Top Description */}
        <p className="text-[14px] text-[#6B6B6B] leading-relaxed px-1">
          Choose the day your monthly spending cycle starts.
        </p>

        {/* Calendar Selection Card */}
        <div className="shrink-0 bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col text-left">
          {/* Card Header */}
          <div className="p-4">
            <h3 className="text-[17px] font-bold text-[#1A1A1A] leading-tight">
              My month starts on ...
            </h3>
          </div>

          <div className="border-t border-[#EFE7DD]" />

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-0.5 gap-x-0.5 p-5 text-center">
            {days.map((day) => {
              const isSelected = day === tempResetDay
              return (
                <div key={day} className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setTempResetDay(day)}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all border-0 outline-none cursor-pointer",
                      isSelected
                        ? "bg-positive text-white font-bold"
                        : "bg-transparent text-[#6B6B6B] hover:bg-muted/10"
                    )}
                  >
                    {day}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="border-t border-[#EFE7DD]" />

          {/* Card Footer */}
          <div className="p-4 text-left">
            <p className="text-[13px] text-[#6B6B6B] font-medium leading-tight">
              Your monthly personal expense calculation will start on the {getOrdinal(tempResetDay)} of every month.
            </p>
          </div>
        </div>

        {/* How this works Banner */}
        <div className="shrink-0 bg-[#E4F2EB] border-[1.5px] border-[#0B683A26] rounded-[14px] p-5 text-left flex flex-col gap-2.5 shadow-[0px_4px_16px_rgba(0,0,0,0.01)]">
          <h4 className="text-[14px] font-bold text-positive flex items-center gap-2">
            <Info size={16} strokeWidth={2.5} className="shrink-0" />
            How this works
          </h4>
          <p className="text-[13px] text-[#6B6B6B] font-normal leading-relaxed">
            Choose the date your My Expenses month should start. For example, if your salary arrives on the same day every month, pick that day.
          </p>
          <p className="text-[13px] text-[#6B6B6B] font-normal leading-relaxed">
            My Expenses will then track your spending from the {getOrdinal(tempResetDay)} of every month to the {getOrdinal(prevDay)} of the next month.
          </p>
          <div className="text-[13px] text-[#6B6B6B] flex flex-col gap-0.5">
            <span>Example:</span>
            <span className='text-positive font-semibold'>{getOrdinal(tempResetDay)} {currentMonthName} &rarr; {getOrdinal(prevDay)} {nextMonthName}</span>
          </div>
          <p className="text-[13px] text-[#6B6B6B] font-normal leading-relaxed">
            All expenses between these dates will appear in the same My Expenses month.
          </p>
        </div>
      </div>

      {/* Fixed bottom action button */}
      <div className="safe-action-fixed z-10">
        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="w-full max-w-md h-14 rounded-full bg-positive hover:bg-positive/95 text-white font-bold text-base"
        >
          Save
        </Button>
      </div>
    </div>
  )
}
