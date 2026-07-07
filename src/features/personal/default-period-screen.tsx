import { useState } from 'react'
import { Info } from 'lucide-react'
import { useContactStore } from '@/store/use-contact-store'
import FlowHeader from '@/components/shared/flow-header'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function getOrdinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default function DefaultPeriodScreen() {
  const { resetDay, setResetDay } = useContactStore()
  const [tempResetDay, setTempResetDay] = useState(resetDay)

  const handleSave = () => {
    setResetDay(tempResetDay)
    window.history.back()
  }

  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  // Calculate previous day for the "How this works" explanation
  const prevDay = tempResetDay - 1 === 0 ? 31 : tempResetDay - 1

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none overflow-hidden text-[#1A1A1A] text-left">
      {/* Top Header */}
      <FlowHeader
        title="Default Period"
        backVariant="circle"
        rightSlot={
          <button
            onClick={handleSave}
            className="text-positive font-bold text-base bg-transparent border-0 cursor-pointer outline-none hover:opacity-85"
          >
            Save
          </button>
        }
      />

      {/* Main Scroll Container */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 flex flex-col gap-5 mt-2">
        {/* Top Description */}
        <p className="text-[14px] text-[#6B6B6B] leading-relaxed px-1">
          Choose the day your monthly spending cycle starts.
        </p>

        {/* Calendar Selection Card */}
        <div className="bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col text-left">
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
              Your monthly personal expens calculation will start on the {getOrdinal(tempResetDay)} of every month
            </p>
          </div>
        </div>

        {/* How this works Banner */}
        <div className="bg-[#E4F2EB] border-[1.5px] border-[#0B683A26] rounded-[14px] p-5 text-left flex flex-col gap-2.5 shadow-[0px_4px_16px_rgba(0,0,0,0.01)]">
          <h4 className="text-[14px] font-bold text-positive flex items-center gap-2">
            <Info size={16} strokeWidth={2.5} className="shrink-0" />
            How this works
          </h4>
          <p className="text-[13px] text-[#6B6B6B] font-normal leading-relaxed">
            Choose the date your My Expenses month should start.For example, if your salary comes on the 7th, select 7.
          </p>
          <p className="text-[13px] text-[#6B6B6B] font-normal leading-relaxed">
            Then My Expenses will track your spending from the {tempResetDay}st of every month to the {prevDay}th of next month.
          </p>
          <div className="text-[13px] text-[#6B6B6B] flex flex-col gap-0.5">
            <span>Example:</span>
            <span className='text-positive font-semibold'>{tempResetDay} June &rarr; {prevDay} July</span>
          </div>
          <p className="text-[13px] text-[#6B6B6B] font-normal leading-relaxed">
            All expenses between these dates will appear in the same My Expenses month.
          </p>
        </div>
      </div>

      {/* Fixed bottom action button */}
      <div className="fixed bottom-3 left-3 right-3 z-10">
        <Button
          onClick={handleSave}
          className="w-full max-w-md h-14 rounded-full bg-positive hover:bg-positive/95 text-white font-bold text-base"
        >
          Save
        </Button>
      </div>
    </div>
  )
}
