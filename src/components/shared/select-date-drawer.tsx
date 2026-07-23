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
  // Bumped whenever isOpen transitions to true, forcing SelectDateDrawerContent to remount
  // with fresh initial state - the idiomatic replacement for a "resync on open" effect.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const [openKey, setOpenKey] = useState(0)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) setOpenKey((k) => k + 1)
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DrawerContent className="bg-white rounded-t-[32px] border-t-0 p-0 flex flex-col focus:outline-none overflow-hidden text-foreground">
        <SelectDateDrawerContent
          key={openKey}
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
      <div className="px-6 pt-5 pb-3 shrink-0 flex items-center justify-between">
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
      <div className="flex-1 px-6 py-2 flex flex-col items-center overflow-y-auto">
        {/* Calendar Picker Block */}
        <div className="w-full py-1">
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
            disabled={(date) => date > new Date()}
            captionLayout={isDob ? 'dropdown' : 'label'}
            startMonth={isDob ? new Date(1920, 0) : undefined}
            endMonth={isDob ? new Date() : undefined}
            showOutsideDays={false}
            classNames={{
              root: 'w-full',
              month: 'w-full',
              weekdays: 'w-full flex',
              week: 'w-full flex',
              day: 'flex-1 flex items-center justify-center',
            }}
            components={{
              Chevron: ({ orientation }) => {
                if (orientation === 'left') {
                  return <ChevronLeft className="size-5 text-foreground stroke-[2.5px]" />
                }
                return <ChevronRight className="size-5 text-foreground stroke-[2.5px]" />
              }
            }}
            formatters={{
              formatWeekdayName: (date) => date.toLocaleString('en-US', { weekday: 'narrow' })
            }}
            className="bg-white p-0 border-0 w-full
              [&_.rdp-month]:gap-2
              [&_.rdp-month_caption]:h-10! [&_.rdp-month_caption]:flex [&_.rdp-month_caption]:items-center [&_.rdp-month_caption]:justify-center [&_.rdp-month_caption]:font-bold! [&_.rdp-month_caption]:text-[18px]! [&_.rdp-month_caption]:text-foreground
              [&_.rdp-caption_label]:font-bold! [&_.rdp-caption_label]:text-[18px]! [&_.rdp-caption_label]:text-foreground
              [&_.rdp-nav]:absolute [&_.rdp-nav]:inset-x-0 [&_.rdp-nav]:top-0 [&_.rdp-nav]:h-10 [&_.rdp-nav]:flex [&_.rdp-nav]:items-center [&_.rdp-nav]:justify-between [&_.rdp-nav]:w-full [&_.rdp-nav]:pointer-events-none
              [&_.rdp-button_previous]:pointer-events-auto [&_.rdp-button_previous]:w-9 [&_.rdp-button_previous]:h-9 [&_.rdp-button_previous]:flex [&_.rdp-button_previous]:items-center [&_.rdp-button_previous]:justify-center [&_.rdp-button_previous]:text-foreground [&_.rdp-button_previous]:rounded-full [&_.rdp-button_previous]:transition-colors [&_.rdp-button_previous]:outline-none
              [&_.rdp-button_next]:pointer-events-auto [&_.rdp-button_next]:w-9 [&_.rdp-button_next]:h-9 [&_.rdp-button_next]:flex [&_.rdp-button_next]:items-center [&_.rdp-button_next]:justify-center [&_.rdp-button_next]:text-foreground [&_.rdp-button_next]:rounded-full [&_.rdp-button_next]:transition-colors [&_.rdp-button_next]:outline-none
              [&_.rdp-weekday]:text-muted-faint [&_.rdp-weekday]:font-semibold [&_.rdp-weekday]:text-xs [&_.rdp-weekday]:h-6 [&_.rdp-weekday]:flex [&_.rdp-weekday]:items-center [&_.rdp-weekday]:justify-center
              [&_.rdp-week]:mt-0.5!
              [&_button[data-day]]:w-10 [&_button[data-day]]:h-10 [&_button[data-day]]:flex [&_button[data-day]]:items-center [&_button[data-day]]:justify-center [&_button[data-day]]:font-medium! [&_button[data-day]]:text-[13px]! [&_button[data-day]]:text-foreground [&_button[data-day]]:rounded-full [&_button[data-day]]:mx-auto
              **:data-[selected-single=true]:bg-primary! **:data-[selected-single=true]:text-white! **:data-[selected-single=true]:font-bold!
              [&_button[aria-disabled=true]]:text-[#CCCCCC]! [&_button[aria-disabled=true]]:font-normal! [&_button[aria-disabled=true]]:pointer-events-none"
          />
        </div>

        {/* Quick Filter Select Pills */}
        {!isDob && (
          <div className="flex items-center gap-2 mt-4 w-full shrink-0">
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
      <div className="px-6 py-4 bg-white shrink-0">
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
