import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
} from '@/components/ui/drawer'

interface SortFilterDrawerProps {
  children: React.ReactNode
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest'
  onSortByChange: (sort: 'newest' | 'oldest' | 'highest' | 'lowest') => void
  filterType: 'all' | 'people' | 'groups'
  onFilterTypeChange: (filter: 'all' | 'people' | 'groups') => void
}

/**
 * SortFilterDrawer — A reusable drawer component for sorting and filtering contacts.
 * Wraps the trigger passed as children and manages temporary selections.
 */
export default function SortFilterDrawer({
  children,
  sortBy,
  onSortByChange,
  filterType,
  onFilterTypeChange,
}: SortFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempSortBy, setTempSortBy] = useState(sortBy)
  const [tempFilterType, setTempFilterType] = useState(filterType)

  // Sync temporary state with actual state when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTempSortBy(sortBy)
      setTempFilterType(filterType)
    }
  }, [isOpen, sortBy, filterType])

  const handleApply = () => {
    onSortByChange(tempSortBy)
    onFilterTypeChange(tempFilterType)
    setIsOpen(false)
  }

  const handleReset = () => {
    setTempSortBy('newest')
    setTempFilterType('all')
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent className="bg-white rounded-t-[32px] border-t-0 p-0 flex flex-col max-h-[85vh] focus:outline-none overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 shrink-0">
          <h3 className="text-xl font-bold text-[#1A1A1A]">Sort & Filter</h3>
          <button
            type="button"
            onClick={handleReset}
            className="text-base font-bold text-[#E54A3C] hover:text-[#E54A3C]/80 cursor-pointer border-0 bg-transparent"
          >
            Reset
          </button>
        </div>

        <div className="h-px bg-[#EFE7DD] w-full shrink-0" />

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto pb-28 flex flex-col">
          {/* Section 1 Header */}
          <div className="text-[11px] font-bold text-[#9A9590] uppercase tracking-widest px-6 pt-5 pb-2.5 bg-transparent shrink-0">
            Sort by
          </div>

          {/* Section 1 Options */}
          {[
            { value: 'newest', label: 'Newest first' },
            { value: 'oldest', label: 'Oldest first' },
            { value: 'highest', label: 'Highest amount' },
            { value: 'lowest', label: 'Lowest amount' },
          ].map((option) => {
            const isSelected = tempSortBy === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTempSortBy(option.value as any)}
                className={cn(
                  'w-full flex items-center justify-between py-4 px-6 text-left transition-colors focus:outline-none border-0 border-b border-[#EFE7DD] cursor-pointer',
                  isSelected ? 'bg-[#ECF6F0]' : 'bg-white hover:bg-muted/5',
                )}
              >
                <span
                  className={cn(
                    'text-[15px] font-bold',
                    isSelected ? 'text-[#0B683A]' : 'text-[#1A1A1A]',
                  )}
                >
                  {option.label}
                </span>
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all border',
                    isSelected
                      ? 'bg-[#0B683A] border-[#0B683A] text-white'
                      : 'border-[#E2DDD5] bg-white',
                  )}
                >
                  {isSelected && <Check size={12} strokeWidth={4} className="stroke-white" />}
                </div>
              </button>
            )
          })}

          {/* Section 2 Header */}
          <div className="text-[11px] font-bold text-[#9A9590] uppercase tracking-widest px-6 pt-5 pb-2.5 bg-transparent shrink-0">
            Sort by
          </div>

          {/* Section 2 Options */}
          {[
            { value: 'people', label: 'People' },
            { value: 'groups', label: 'Group' },
          ].map((option) => {
            const isSelected = tempFilterType === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setTempFilterType((prev) => (prev === option.value ? 'all' : (option.value as any)))
                }
                className={cn(
                  'w-full flex items-center justify-between py-4 px-6 text-left transition-colors focus:outline-none border-0 border-b border-[#EFE7DD] cursor-pointer',
                  isSelected ? 'bg-[#ECF6F0]' : 'bg-white hover:bg-muted/5',
                )}
              >
                <span
                  className={cn(
                    'text-[15px] font-bold',
                    isSelected ? 'text-[#0B683A]' : 'text-[#1A1A1A]',
                  )}
                >
                  {option.label}
                </span>
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all border',
                    isSelected
                      ? 'bg-[#0B683A] border-[#0B683A] text-white'
                      : 'border-[#E2DDD5] bg-white',
                  )}
                >
                  {isSelected && <Check size={12} strokeWidth={4} className="stroke-white" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer - Apply Filters Button */}
        <div className="absolute bottom-6 left-6 right-6 z-10 shrink-0">
          <Button
            type="button"
            onClick={handleApply}
            className="w-full h-14 rounded-full bg-[#FDB105] hover:bg-[#FDB105]/95 text-white font-extrabold text-[15px] shadow-[0px_4px_12px_rgba(253,177,5,0.3)] active:scale-[0.98] transition-transform cursor-pointer"
          >
            Apply Filters
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
