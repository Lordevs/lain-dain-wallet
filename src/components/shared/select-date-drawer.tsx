import { useState, useEffect } from 'react'
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
  onSelect: (dateText: string) => void
  selectedValue: string // 'today' | 'yesterday' or standard display date
}

// May 2026 default references
const DEFAULT_YEAR = 2026
const DEFAULT_MONTH_INDEX = 4 // May is 4 (0-indexed)
const TODAY_MOCK_DATE = new Date(DEFAULT_YEAR, DEFAULT_MONTH_INDEX, 18)
const YESTERDAY_MOCK_DATE = new Date(DEFAULT_YEAR, DEFAULT_MONTH_INDEX, 17)

export default function SelectDateDrawer({
  isOpen,
  onClose,
  onSelect,
  selectedValue,
}: SelectDateDrawerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(TODAY_MOCK_DATE)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(DEFAULT_YEAR, DEFAULT_MONTH_INDEX, 1))
  const [activePill, setActivePill] = useState<'today' | 'yesterday' | 'custom'>('today')

  useEffect(() => {
    if (isOpen) {
      if (selectedValue === 'yesterday') {
        setSelectedDate(YESTERDAY_MOCK_DATE)
        setCurrentMonth(new Date(DEFAULT_YEAR, DEFAULT_MONTH_INDEX, 1))
        setActivePill('yesterday')
      } else if (selectedValue === 'today') {
        setSelectedDate(TODAY_MOCK_DATE)
        setCurrentMonth(new Date(DEFAULT_YEAR, DEFAULT_MONTH_INDEX, 1))
        setActivePill('today')
      } else {
        // Parse a custom date text if possible, fallback to Today
        const dayMatch = selectedValue.match(/^(\d+)/)
        if (dayMatch) {
          const parsedDay = Number(dayMatch[1])
          setSelectedDate(new Date(DEFAULT_YEAR, DEFAULT_MONTH_INDEX, parsedDay))
        } else {
          setSelectedDate(TODAY_MOCK_DATE)
        }
        setCurrentMonth(new Date(DEFAULT_YEAR, DEFAULT_MONTH_INDEX, 1))
        setActivePill('custom')
      }
    }
  }, [isOpen, selectedValue])

  // Handle pill quick select clicks
  const handlePillClick = (type: 'today' | 'yesterday' | 'custom') => {
    setActivePill(type)
    if (type === 'today') {
      setSelectedDate(TODAY_MOCK_DATE)
      setCurrentMonth(new Date(DEFAULT_YEAR, DEFAULT_MONTH_INDEX, 1))
    } else if (type === 'yesterday') {
      setSelectedDate(YESTERDAY_MOCK_DATE)
      setCurrentMonth(new Date(DEFAULT_YEAR, DEFAULT_MONTH_INDEX, 1))
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

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DrawerContent className="bg-white rounded-t-[32px] border-t-0 p-0 flex flex-col focus:outline-none overflow-hidden text-[#1A1A1A]">
        {/* Drawer Header */}
        <div className="px-6 pt-5 pb-3 shrink-0 flex items-center justify-between">
          <h3 className="text-[17px] font-bold text-[#1A1A1A] text-left">Select Date</h3>
          <DrawerClose asChild>
            <button
              type="button"
              className="size-9 rounded-full bg-[#F7F5F0] border-0 flex items-center justify-center cursor-pointer outline-none focus:outline-none transition-colors"
            >
              <X size={16} className="text-[#6B6B6B] stroke-[2.5px]" />
            </button>
          </DrawerClose>
        </div>

        <hr className="border-[#EBEBEB] border-b-[0.8px] w-full shrink-0" />

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
                  if (isSameDay(date, TODAY_MOCK_DATE)) {
                    setActivePill('today')
                  } else if (isSameDay(date, YESTERDAY_MOCK_DATE)) {
                    setActivePill('yesterday')
                  } else {
                    setActivePill('custom')
                  }
                }
              }}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              disabled={[
                new Date(DEFAULT_YEAR, DEFAULT_MONTH_INDEX, 2),
                new Date(DEFAULT_YEAR, DEFAULT_MONTH_INDEX, 8),
                new Date(DEFAULT_YEAR, DEFAULT_MONTH_INDEX, 9),
                new Date(DEFAULT_YEAR, DEFAULT_MONTH_INDEX, 15),
                new Date(DEFAULT_YEAR, DEFAULT_MONTH_INDEX, 21),
                new Date(DEFAULT_YEAR, DEFAULT_MONTH_INDEX, 28)
              ]}
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
                    return <ChevronLeft className="size-5 text-[#1A1A1A] stroke-[2.5px]" />
                  }
                  return <ChevronRight className="size-5 text-[#1A1A1A] stroke-[2.5px]" />
                }
              }}
              formatters={{
                formatWeekdayName: (date) => date.toLocaleString('en-US', { weekday: 'narrow' })
              }}
              className="bg-white p-0 border-0 w-full 
                [&_.rdp-month]:gap-2 
                [&_.rdp-month_caption]:h-10! [&_.rdp-month_caption]:flex [&_.rdp-month_caption]:items-center [&_.rdp-month_caption]:justify-center [&_.rdp-month_caption]:font-bold! [&_.rdp-month_caption]:text-[18px]! [&_.rdp-month_caption]:text-[#1A1A1A] 
                [&_.rdp-caption_label]:font-bold! [&_.rdp-caption_label]:text-[18px]! [&_.rdp-caption_label]:text-[#1A1A1A] 
                [&_.rdp-nav]:absolute [&_.rdp-nav]:inset-x-0 [&_.rdp-nav]:top-0 [&_.rdp-nav]:h-10 [&_.rdp-nav]:flex [&_.rdp-nav]:items-center [&_.rdp-nav]:justify-between [&_.rdp-nav]:w-full [&_.rdp-nav]:pointer-events-none 
                [&_.rdp-button_previous]:pointer-events-auto [&_.rdp-button_previous]:w-9 [&_.rdp-button_previous]:h-9 [&_.rdp-button_previous]:flex [&_.rdp-button_previous]:items-center [&_.rdp-button_previous]:justify-center [&_.rdp-button_previous]:text-[#1A1A1A] [&_.rdp-button_previous]:rounded-full [&_.rdp-button_previous]:transition-colors [&_.rdp-button_previous]:outline-none 
                [&_.rdp-button_next]:pointer-events-auto [&_.rdp-button_next]:w-9 [&_.rdp-button_next]:h-9 [&_.rdp-button_next]:flex [&_.rdp-button_next]:items-center [&_.rdp-button_next]:justify-center [&_.rdp-button_next]:text-[#1A1A1A] [&_.rdp-button_next]:rounded-full [&_.rdp-button_next]:transition-colors [&_.rdp-button_next]:outline-none 
                [&_.rdp-weekday]:text-[#9A9590] [&_.rdp-weekday]:font-semibold [&_.rdp-weekday]:text-xs [&_.rdp-weekday]:h-6 [&_.rdp-weekday]:flex [&_.rdp-weekday]:items-center [&_.rdp-weekday]:justify-center 
                [&_.rdp-week]:mt-0.5! 
                [&_button[data-day]]:w-10 [&_button[data-day]]:h-10 [&_button[data-day]]:flex [&_button[data-day]]:items-center [&_button[data-day]]:justify-center [&_button[data-day]]:font-medium! [&_button[data-day]]:text-[13px]! [&_button[data-day]]:text-[#1A1A1A] [&_button[data-day]]:rounded-full [&_button[data-day]]:mx-auto 
                **:data-[selected-single=true]:bg-primary! **:data-[selected-single=true]:text-white! **:data-[selected-single=true]:font-bold! 
                [&_button[aria-disabled=true]]:text-[#CCCCCC]! [&_button[aria-disabled=true]]:font-normal! [&_button[aria-disabled=true]]:pointer-events-none"
            />
          </div>

          {/* Quick Filter Select Pills */}
          <div className="flex items-center gap-2 mt-4 w-full shrink-0">
            <button
              type="button"
              onClick={() => handlePillClick('today')}
              className={cn(
                'px-4 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer outline-none',
                activePill === 'today'
                  ? 'bg-[#E4F2EB] border-[#0B683A33] text-primary'
                  : 'bg-[#F7F5F0] border-[#EBEBEB] text-[#6B6B6B]'
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
                  ? 'bg-[#E4F2EB] border-[#0B683A33] text-primary'
                  : 'bg-[#F7F5F0] border-[#EBEBEB] text-[#6B6B6B]'
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
                  ? 'bg-[#E4F2EB] border-[#0B683A33] text-primary'
                  : 'bg-[#F7F5F0] border-[#EBEBEB] text-[#6B6B6B]'
              )}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Pinned Bottom Selection Confirm Bar */}
        <div className="px-6 py-4 bg-white shrink-0">
          <button
            type="button"
            onClick={() => {
              const displayDate = activePill === 'today' ? 'today' : activePill === 'yesterday' ? 'yesterday' : `${selectedDate.getDate()} ${getMonthName(selectedDate)}`
              onSelect(displayDate)
              onClose()
            }}
            className="w-full h-14 rounded-full bg-secondary text-white font-extrabold text-base cursor-pointer shadow-[0px_3px_12px_0px_#0B683A47] active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
          >
            Select {selectedDate.getDate()} {getMonthName(selectedDate)}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
