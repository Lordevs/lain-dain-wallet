import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from '@/components/ui/drawer'
import { Calendar } from '@/components/ui/calendar'

interface SelectDateDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSelect?: (dateText: string) => void
  onSelectDate?: (date: Date) => void
  /** Fires alongside onSelect (expense mode only) with a real YYYY-MM-DD —
   * onSelect's string is a display label ("today"/"yesterday"/"23 Jul"),
   * not something a backend date field can parse. */
  onSelectISODate?: (iso: string) => void
  selectedValue?: string // 'today' | 'yesterday' or standard display date
  selectedDateValue?: Date
  type?: 'expense' | 'dob'
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const TODAY_DATE = startOfDay(new Date())
const YESTERDAY_DATE = new Date(TODAY_DATE.getFullYear(), TODAY_DATE.getMonth(), TODAY_DATE.getDate() - 1)

type DatePill = 'today' | 'yesterday' | 'custom'

function getInitialDateState(selectedValue: string): { selectedDate: Date; activePill: DatePill } {
  if (selectedValue === 'yesterday') {
    return { selectedDate: YESTERDAY_DATE, activePill: 'yesterday' }
  }
  if (selectedValue === 'today') {
    return { selectedDate: TODAY_DATE, activePill: 'today' }
  }
  // Parse a custom date text if possible, fallback to Today
  const dayMatch = selectedValue.match(/^(\d+)/)
  const selectedDate = dayMatch
    ? new Date(TODAY_DATE.getFullYear(), TODAY_DATE.getMonth(), Number(dayMatch[1]))
    : TODAY_DATE
  return { selectedDate, activePill: 'custom' }
}

export default function SelectDateDrawer({
  isOpen,
  onClose,
  onSelect,
  onSelectDate,
  onSelectISODate,
  selectedValue = 'today',
  selectedDateValue,
  type = 'expense',
}: SelectDateDrawerProps) {
  // Changing from closed -> open changes this key and gives the drawer fresh
  // selection state without calling setState during render (which caused an
  // extra render and visible hitch each time the calendar opened).
  const contentKey = isOpen
    ? `open-${type}-${selectedDateValue?.getTime() ?? selectedValue}`
    : 'closed'

  return (
    <Drawer
      open={isOpen}
      repositionInputs={false}
      onOpenChange={(open) => { if (!open) onClose() }}
    >
      <DrawerContent
        className="bg-white rounded-t-[32px] border-t-0 p-0 flex flex-col focus:outline-none overflow-hidden text-foreground data-[vaul-drawer-direction=bottom]:h-[min(42rem,calc(var(--app-viewport-height,100dvh)-var(--safe-top)-0.5rem))] data-[vaul-drawer-direction=bottom]:max-h-[calc(var(--app-viewport-height,100dvh)-var(--safe-top)-0.5rem)]"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        <SelectDateDrawerContent
          key={contentKey}
          onClose={onClose}
          onSelect={onSelect}
          onSelectDate={onSelectDate}
          onSelectISODate={onSelectISODate}
          selectedValue={selectedValue}
          selectedDateValue={selectedDateValue}
          type={type}
        />
      </DrawerContent>
    </Drawer>
  )
}

function SelectDateDrawerContent({
  onClose,
  onSelect,
  onSelectDate,
  onSelectISODate,
  selectedValue = 'today',
  selectedDateValue,
  type = 'expense',
}: Omit<SelectDateDrawerProps, 'isOpen'>) {
  const isDob = type === 'dob'

  // Initialize selected date based on type
  const initialDate = isDob
    ? (selectedDateValue || new Date(2000, 0, 1))
    : getInitialDateState(selectedValue).selectedDate

  const initialPill = isDob ? 'custom' : getInitialDateState(selectedValue).activePill

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1))
  const [activePill, setActivePill] = useState<DatePill>(initialPill)
  const earliestMonth = isDob ? new Date(1920, 0, 1) : new Date(2000, 0, 1)
  const latestMonth = new Date(TODAY_DATE.getFullYear(), TODAY_DATE.getMonth(), 1)
  const canGoPrevious = currentMonth > earliestMonth
  const canGoNext = currentMonth < latestMonth

  const changeMonth = (direction: -1 | 1) => {
    setCurrentMonth((month) => {
      const next = new Date(month.getFullYear(), month.getMonth() + direction, 1)
      if (next < earliestMonth) return earliestMonth
      if (next > latestMonth) return latestMonth
      return next
    })
  }

  // Handle pill quick select clicks
  const handlePillClick = (type: 'today' | 'yesterday' | 'custom') => {
    setActivePill(type)
    if (type === 'today') {
      setSelectedDate(TODAY_DATE)
      setCurrentMonth(new Date(TODAY_DATE.getFullYear(), TODAY_DATE.getMonth(), 1))
    } else if (type === 'yesterday') {
      setSelectedDate(YESTERDAY_DATE)
      setCurrentMonth(new Date(YESTERDAY_DATE.getFullYear(), YESTERDAY_DATE.getMonth(), 1))
    }
  }

  const getMonthName = (date: Date) => {
    return date.toLocaleString('en-US', { month: 'short' }) // e.g. "May"
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
  }

  const handleConfirmSelect = () => {
    if (isDob) {
      onSelectDate?.(selectedDate)
    } else {
      const displayDate = activePill === 'today' ? 'today' : activePill === 'yesterday' ? 'yesterday' : `${selectedDate.getDate()} ${getMonthName(selectedDate)}`
      onSelect?.(displayDate)
      onSelectISODate?.(toISODate(selectedDate))
    }
    onClose()
  }

  const formatButtonText = () => {
    if (isDob) {
      return `Select ${selectedDate.getDate()} ${getMonthName(selectedDate)} ${selectedDate.getFullYear()}`
    }
    return `Select ${selectedDate.getDate()} ${getMonthName(selectedDate)}`
  }

  return (
    <>
      {/* Drawer Header */}
      <div className="mx-auto flex w-full max-w-lg shrink-0 items-center justify-between px-4 pt-4 pb-2 sm:px-6 sm:pt-5 sm:pb-3">
        <h3 className="text-[17px] font-bold text-foreground text-left">
          {isDob ? 'Select Date of Birth' : 'Select Date'}
        </h3>
        <DrawerClose asChild>
          <button
            type="button"
            className="size-9 rounded-full bg-hover-bg border-0 flex items-center justify-center cursor-pointer outline-none focus:outline-none transition-colors"
          >
            <X size={16} className="text-muted-foreground stroke-[2.5px]" />
          </button>
        </DrawerClose>
      </div>

      <hr className="border-divider border-b-[0.8px] w-full shrink-0" />

      {/* Content Area */}
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col items-center overflow-y-auto overscroll-contain px-4 py-2 sm:px-6">
        {/* Calendar Picker Block */}
        <div className="relative w-full py-1">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            disabled={!canGoPrevious}
            aria-label="Previous month"
            className="absolute left-0 top-1 z-20 flex size-10 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-hover-bg disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="size-5 stroke-[2.5px]" />
          </button>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            disabled={!canGoNext}
            aria-label="Next month"
            className="absolute right-0 top-1 z-20 flex size-10 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-hover-bg disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="size-5 stroke-[2.5px]" />
          </button>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                setSelectedDate(date)
                if (!isDob) {
                  if (isSameDay(date, TODAY_DATE)) {
                    setActivePill('today')
                  } else if (isSameDay(date, YESTERDAY_DATE)) {
                    setActivePill('yesterday')
                  } else {
                    setActivePill('custom')
                  }
                }
              }
            }}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            disabled={{ after: TODAY_DATE }}
            captionLayout="dropdown"
            startMonth={earliestMonth}
            endMonth={TODAY_DATE}
            showOutsideDays={false}
            classNames={{
              root: 'w-full',
              month: 'w-full',
              weekdays: 'w-full flex',
              week: 'w-full flex',
              day: 'flex-1 flex items-center justify-center',
            }}
            formatters={{
              formatWeekdayName: (date) => date.toLocaleString('en-US', { weekday: 'narrow' })
            }}
            className="bg-white p-0 border-0 w-full
              [&_.rdp-month]:gap-2
              [&_.rdp-month_caption]:h-10! [&_.rdp-month_caption]:flex [&_.rdp-month_caption]:items-center [&_.rdp-month_caption]:justify-center [&_.rdp-month_caption]:font-bold! [&_.rdp-month_caption]:text-[18px]! [&_.rdp-month_caption]:text-foreground
              [&_.rdp-caption_label]:font-bold! [&_.rdp-caption_label]:text-[16px]! [&_.rdp-caption_label]:text-foreground
              [&_.rdp-dropdowns]:relative [&_.rdp-dropdowns]:z-10 [&_.rdp-dropdowns]:gap-2
              [&_.rdp-dropdown_root]:rounded-full [&_.rdp-dropdown_root]:bg-hover-bg [&_.rdp-dropdown_root]:px-2.5 [&_.rdp-dropdown_root]:py-1
              [&_.rdp-dropdown]:cursor-pointer
              [&_.rdp-nav]:hidden!
              [&_.rdp-weekday]:text-muted-faint [&_.rdp-weekday]:font-semibold [&_.rdp-weekday]:text-xs [&_.rdp-weekday]:h-6 [&_.rdp-weekday]:flex [&_.rdp-weekday]:items-center [&_.rdp-weekday]:justify-center
              [&_.rdp-week]:mt-0.5!
              [&_button[data-day]]:size-[clamp(2rem,10vw,2.5rem)] [&_button[data-day]]:flex [&_button[data-day]]:items-center [&_button[data-day]]:justify-center [&_button[data-day]]:font-medium! [&_button[data-day]]:text-[13px]! [&_button[data-day]]:text-foreground [&_button[data-day]]:rounded-full [&_button[data-day]]:mx-auto
              **:data-[selected-single=true]:bg-primary! **:data-[selected-single=true]:text-white! **:data-[selected-single=true]:font-bold!
              [&_button[aria-disabled=true]]:text-[#CCCCCC]! [&_button[aria-disabled=true]]:font-normal! [&_button[aria-disabled=true]]:pointer-events-none"
          />
        </div>

        {/* Quick Filter Select Pills */}
        {!isDob && (
          <div className="relative z-10 flex w-full shrink-0 items-center gap-2 bg-white pt-3">
            <button
              type="button"
              onClick={() => handlePillClick('today')}
              className={cn(
                'px-4 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer outline-none',
                activePill === 'today'
                  ? 'bg-positive-soft-bg border-positive/20 text-primary'
                  : 'bg-hover-bg border-divider text-muted-foreground'
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handlePillClick('yesterday')}
              className={cn(
                'px-4 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer outline-none',
                activePill === 'yesterday'
                  ? 'bg-positive-soft-bg border-positive/20 text-primary'
                  : 'bg-hover-bg border-divider text-muted-foreground'
              )}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => handlePillClick('custom')}
              className={cn(
                'px-4 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer outline-none',
                activePill === 'custom'
                  ? 'bg-positive-soft-bg border-positive/20 text-primary'
                  : 'bg-hover-bg border-divider text-muted-foreground'
              )}
            >
              Custom
            </button>
          </div>
        )}
      </div>

      {/* Pinned Bottom Selection Confirm Bar */}
      <div className="mx-auto w-full max-w-lg shrink-0 bg-white px-4 pt-3 pb-3 sm:px-6 sm:pt-4 sm:pb-4">
        <button
          type="button"
          onClick={handleConfirmSelect}
          className="w-full h-14 rounded-full bg-[#0B683A] hover:bg-[#0B683A]/95 text-white font-extrabold text-base cursor-pointer active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
        >
          {formatButtonText()}
        </button>
      </div>
    </>
  )
}
