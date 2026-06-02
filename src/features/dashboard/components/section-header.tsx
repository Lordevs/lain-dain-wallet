import { SlidersHorizontal, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  currentFilter: 'all' | 'people' | 'groups'
  onFilterChange: (filter: 'all' | 'people' | 'groups') => void
}

/**
 * SectionHeader — reusable row with a bold label and a filter icon button.
 * Used above the receivables and payables lists.
 */
export default function SectionHeader({
  title,
  currentFilter,
  onFilterChange,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 mt-5 mb-3">
      <h2 className="text-[15px] font-extrabold text-foreground">{title}</h2>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="filter-btn"
            variant="outline"
            className={cn(
              "w-9 h-9 rounded-full bg-white! border-[1.08px] border-[#EFE7DD] flex items-center justify-center text-[#9A9590] hover:text-foreground hover:bg-white transition-colors shadow-[0px_2px_8px_0px_#0000000A] p-0 shrink-0 cursor-pointer",
              currentFilter !== 'all' && "border-primary text-primary bg-primary/5 hover:bg-primary/5"
            )}
            aria-label="Filter"
          >
            <SlidersHorizontal size={16} strokeWidth={2} />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-40 p-1 bg-white border-[0.5px] border-[#EFE7DD] rounded-lg shadow-none z-50">
          <div className="flex flex-col gap-0.5">
            {(['all', 'people', 'groups'] as const).map((option) => (
              <Button
                key={option}
                type='button'
                variant='ghost'
                onClick={() => onFilterChange(option)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors",
                  currentFilter === option
                    ? "bg-[#FEF5EE] text-primary"
                    : "text-foreground/75 hover:bg-muted/50"
                )}
              >
                <span className="capitalize">{option}</span>
                {currentFilter === option && <Check size={14} className="text-primary" />}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
