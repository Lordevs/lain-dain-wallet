import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
} from '@/components/ui/drawer'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from '@/components/ui/item'
import { Button } from '@/components/ui/button'
import type { GroupSortBy } from '../api/use-group-transactions-query'

interface GroupExpensesFilterDrawerProps {
  children: React.ReactNode
  sortBy: GroupSortBy
  onSortByChange: (sort: GroupSortBy) => void
}

/** Sort-only — category filtering lives in GroupCategoryFilterPills
 * instead (a coarse "All vs Category" toggle used to live here, but the
 * real per-category pills replace it entirely). */
export default function GroupExpensesFilterDrawer({
  children,
  sortBy,
  onSortByChange,
}: GroupExpensesFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [openKey, setOpenKey] = useState(0)

  const handleOpenChange = (open: boolean) => {
    if (open) setOpenKey((k) => k + 1)
    setIsOpen(open)
  }

  const handleApply = (nextSortBy: GroupSortBy) => {
    onSortByChange(nextSortBy)
    setIsOpen(false)
  }

  const handleReset = () => {
    onSortByChange('newest')
    setIsOpen(false)
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent className="bg-white rounded-t-[32px] border-t-0 p-0 flex flex-col max-h-[85vh] focus:outline-none overflow-hidden text-[#1A1A1A]">
        <GroupExpensesFilterForm
          key={openKey}
          sortBy={sortBy}
          onApply={handleApply}
          onReset={handleReset}
        />
      </DrawerContent>
    </Drawer>
  )
}

interface GroupExpensesFilterFormProps {
  sortBy: GroupSortBy
  onApply: (sortBy: GroupSortBy) => void
  onReset: () => void
}

function GroupExpensesFilterForm({
  sortBy,
  onApply,
  onReset,
}: GroupExpensesFilterFormProps) {
  const [tempSortBy, setTempSortBy] = useState<GroupSortBy>(sortBy)

  const handleApply = () => {
    onApply(tempSortBy)
  }

  const handleReset = () => {
    setTempSortBy('newest')
    onReset()
  }

  return (
    <>
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
        {/* Sort by section */}
        <div className="text-[11px] font-bold text-[#9A9590] uppercase tracking-widest px-6 pt-5 pb-2.5 bg-transparent shrink-0">
          Sort by
        </div>

        <RadioGroup
          value={tempSortBy}
          onValueChange={(val) => setTempSortBy(val as GroupSortBy)}
          className="gap-0 divide-y divide-[#EFE7DD] shrink-0"
        >
          {[
            { value: 'newest', label: 'Newest first' },
            { value: 'oldest', label: 'Oldest first' },
            { value: 'highest', label: 'Highest amount' },
            { value: 'lowest', label: 'Lowest amount' },
          ].map((option) => {
            const isSelected = tempSortBy === option.value
            return (
              <label
                key={option.value}
                htmlFor={`sort-${option.value}`}
                className="w-full cursor-pointer"
              >
                <Item
                  className={cn(
                    'flex items-center justify-between py-4 px-6 transition-colors rounded-none border-0',
                    isSelected ? 'bg-[#ECF6F0]' : 'bg-white hover:bg-muted/5',
                  )}
                >
                  <ItemContent className="text-left">
                    <ItemTitle
                      className={cn(
                        'text-[15px] font-bold',
                        isSelected ? 'text-positive' : 'text-[#1A1A1A]',
                      )}
                    >
                      {option.label}
                    </ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <RadioGroupItem
                      value={option.value}
                      id={`sort-${option.value}`}
                      className={cn(
                        'w-6 h-6 border-[1.5px] shrink-0 border-[#E2DDD5]',
                        'data-[state=checked]:bg-positive data-[state=checked]:border-positive'
                      )}
                    />
                  </ItemActions>
                </Item>
              </label>
            )
          })}
        </RadioGroup>
      </div>

      {/* Footer - Apply Filters Button */}
      <div className="fixed bottom-3 left-3 right-3 z-10">
        <Button
          type="button"
          onClick={handleApply}
          className="w-full h-14 rounded-full bg-[#FDB105] hover:bg-[#FDB105]/95 text-white font-extrabold text-[15px] active:scale-[0.98] transition-transform cursor-pointer"
        >
          Apply Filters
        </Button>
      </div>
    </>
  )
}
