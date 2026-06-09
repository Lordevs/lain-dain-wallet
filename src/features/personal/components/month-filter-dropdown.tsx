import { ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

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
  align = 'end',
  triggerClassName,
}: MonthFilterDropdownProps<T>) {
  const currentOption = options.find((opt) => opt.value === value)
  const displayLabel = currentOption ? currentOption.label : value

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={
            triggerClassName ||
            'flex items-center gap-1.5 px-3.5 py-1 bg-[#F7F5F0] rounded-full text-[10px] font-bold text-[#6B6B6B] border-[0.67px] border-[#EBEBEB] cursor-pointer outline-none select-none transition-colors hover:bg-[#EFEADB]'
          }
        >
          {displayLabel}
          <ChevronDown size={12} className="text-[#6B6B6B]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-40 bg-white p-1 rounded-md shadow-lg border border-[#EFE7DD] z-50"
      >
        <div className="flex flex-col">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${value === option.value
                  ? 'bg-[#DCEFE4] text-primary'
                  : 'text-[#6B6B6B] hover:bg-[#F7F5F0]'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
