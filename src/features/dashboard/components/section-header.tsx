import { ListFilter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import SortFilterDrawer from './sort-filter-drawer'

interface SectionHeaderProps {
  title: string
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest'
  onSortByChange: (sort: 'newest' | 'oldest' | 'highest' | 'lowest') => void
  filterType: 'all' | 'people' | 'groups'
  onFilterTypeChange: (filter: 'all' | 'people' | 'groups') => void
}

/**
 * SectionHeader — reusable row with a bold label and a filter icon button.
 * Triggers the Sort & Filter Drawer.
 */
export default function SectionHeader({
  title,
  sortBy,
  onSortByChange,
  filterType,
  onFilterTypeChange,
}: SectionHeaderProps) {
  const isFilterActive = sortBy !== 'newest' || filterType !== 'all'

  return (
    <div className="flex items-center justify-between px-6 mt-5 mb-3">
      <h2 className="text-[17px] font-bold text-foreground">{title}</h2>
      <SortFilterDrawer
        sortBy={sortBy}
        onSortByChange={onSortByChange}
        filterType={filterType}
        onFilterTypeChange={onFilterTypeChange}
      >
        <Button
          id="filter-btn"
          variant="outline"
          className={cn(
            'w-9 h-9 rounded-full bg-white! border-[1.08px] border-border-card flex items-center justify-center text-muted-faint hover:text-foreground hover:bg-white transition-colors shadow-[0px_2px_8px_0px_#0000000A] p-0 shrink-0 cursor-pointer',
            isFilterActive && 'border-primary text-primary bg-primary/5 hover:bg-primary/5',
          )}
          aria-label="Filter"
        >
          <ListFilter size={16} strokeWidth={2} />
        </Button>
      </SortFilterDrawer>
    </div>
  )
}

