import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import CategoryPieChart from './category-pie-chart'
import type { CategoryBreakdownItem } from '../types'

interface CategoryBreakdownCardProps {
  categories: CategoryBreakdownItem[]
  onViewDetails: () => void
}

/**
 * CategoryBreakdownCard — Reports screen's compact "By Category" card:
 * just the pie chart plus a "View Details" button that opens the full
 * breakdown (pie + per-category legend) on its own screen. The legend
 * itself lives in CategoryBreakdownScreen now, not here.
 */
export default function CategoryBreakdownCard({
  categories,
  onViewDetails,
}: CategoryBreakdownCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] shadow-[0px_2px_10px_0px_#0000000D] p-6 mx-6 mt-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="size-6 flex items-center justify-center shrink-0">
            {/* Custom Pie Icon matching theme */}
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#clip0_275_3327)">
                <path d="M11 21C16.5228 21 21 16.5228 21 11C21 5.47715 16.5228 1 11 1C5.47715 1 1 5.47715 1 11C1 16.5228 5.47715 21 11 21Z" fill="#01592B" />
                <path d="M11 11V1C12.7553 1.00004 14.4798 1.46214 15.9999 2.33984C17.5201 3.21754 18.7824 4.47993 19.6601 6.00011C20.5377 7.52029 20.9998 9.24472 20.9997 11.0001C20.9997 12.7554 20.5377 14.4798 19.66 16L11 11Z" fill="#FDB105" />
                <path d="M11 11L19.66 16C19.0247 17.4237 18.0653 18.6791 16.8584 19.666C15.6516 20.6529 14.2307 21.3439 12.7092 21.684C11.1878 22.024 9.60789 22.0036 8.09572 21.6244C6.58355 21.2452 5.18098 20.5177 4 19.5L11 11Z" fill="#7BAE8A" />
              </g>
              <defs>
                <clipPath id="clip0_275_3327">
                  <rect width="22" height="22" fill="white" />
                </clipPath>
              </defs>
            </svg>

          </div>
          <h2 className="text-[19px] font-extrabold text-[#1A1A1A]">By Category</h2>
        </div>

        {categories.length > 0 && (
          <button
            type="button"
            onClick={onViewDetails}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-white rounded-full text-xs font-bold text-[#1A1A1A] border border-[#EFE7DD] shadow-[0px_2px_8px_rgba(0,0,0,0.04)] cursor-pointer outline-none select-none transition-colors hover:bg-[#F7F5F0] shrink-0"
          >
            View Details
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No expenses this period.</p>
      ) : (
        <div className="flex justify-center">
          <CategoryPieChart
            categories={categories}
            hoveredIndex={hoveredIndex}
            onHoverIndex={setHoveredIndex}
            className="relative w-full aspect-square flex items-center justify-center max-w-[220px]"
          />
        </div>
      )}
    </div>
  )
}
