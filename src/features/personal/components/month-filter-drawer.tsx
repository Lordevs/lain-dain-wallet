import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer'

interface DropdownOption<T extends string> {
  value: T
  label: string
}

interface MonthFilterDropdownProps<T extends string> {
  value: T
  options: DropdownOption<T>[]
  onChange: (value: T) => void
  align?: 'start' | 'center' | 'end'
  triggerClassName?: string
}

export default function MonthFilterDropdown<T extends string>({
  value,
  options,
  onChange,
  triggerClassName,
}: MonthFilterDropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const currentOption = options.find((opt) => opt.value === value)
  const displayLabel = currentOption ? currentOption.label : value

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          className={
            triggerClassName ||
            'flex items-center gap-1.5 px-3.5 py-1 bg-[#F7F5F0] rounded-full text-[10px] font-bold text-[#6B6B6B] border-[0.67px] border-[#EBEBEB] cursor-pointer outline-none select-none transition-colors hover:bg-[#EFEADB]'
          }
        >
          {displayLabel}
          <ChevronDown size={12} className="text-[#6B6B6B]" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="bg-white px-6 pb-8 pt-4 rounded-t-[32px] text-foreground text-left focus:outline-none">
        <div className="mx-auto w-12 h-1.5 rounded-full bg-[#EBEBEB] mb-5" />
        <h3 className="text-[17px] font-extrabold text-[#1A1A1A] mb-4 px-1">Select Period</h3>
        <div className="flex flex-col gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={`w-full text-left px-4 py-3.5 text-[14px] font-bold rounded-[18px] cursor-pointer transition-colors ${
                value === option.value
                  ? 'bg-[#DCEFE4] text-primary'
                  : 'text-[#6B6B6B] hover:bg-[#F7F5F0]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
