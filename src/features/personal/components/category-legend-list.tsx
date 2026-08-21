import { formatCurrency } from '@/lib/currency'
import type { CategoryBreakdownItem } from '../types'

interface CategoryLegendListProps {
  categories: CategoryBreakdownItem[]
  currency: string
  hoveredIndex: number | null
  onHoverIndex: (idx: number | null) => void
  className?: string
}

/** The per-category legend rows (color dot, label, amount, percentage) —
 * extracted from CategoryBreakdownCard so it can be reused on the full
 * CategoryBreakdownScreen below the pie chart there, instead of only
 * alongside it in the compact Reports-screen card. */
export default function CategoryLegendList({ categories, currency, hoveredIndex, onHoverIndex, className }: CategoryLegendListProps) {
  return (
    <div className={className}>
      {categories.map((cat, idx) => {
        const isHovered = hoveredIndex === idx
        return (
          <div
            key={cat.id}
            onMouseEnter={() => onHoverIndex(idx)}
            onMouseLeave={() => onHoverIndex(null)}
            className={`flex items-center justify-between transition-colors p-1 -mx-1 rounded-lg ${isHovered ? 'bg-[#F7F5F0]' : ''
              }`}
          >
            <div className="flex items-center gap-2">
              <span
                className="size-3.5 rounded-full shrink-0 border border-[#FEFAF1]"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-[14px] font-medium text-[#1A1A1A] leading-tight max-w-[95px] text-wrap">
                {cat.label}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[13px] font-bold text-[#1A1A1A]">
                {formatCurrency(cat.amount, currency)}
              </span>
              <span className="text-[11px] font-semibold text-positive">
                {cat.percentage}%
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
