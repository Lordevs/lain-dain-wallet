import type { ReactNode } from 'react'
import { CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGroupUsedCategoriesQuery } from '../api/use-group-used-categories-query'
import { iconForCategory } from '@/features/expenses/lib/category-icons'
import type { GroupTransactionFilter } from '../api/use-group-transactions-query'

interface GroupCategoryFilterPillsProps {
  groupId: string | undefined
  value: GroupTransactionFilter
  onChange: (value: GroupTransactionFilter) => void
}

/** Horizontal scrollable filter bar for the group Expenses list — "All" +
 * only the categories this group actually has expenses in (via
 * useGroupUsedCategoriesQuery, not the full global category list) + a
 * "Payment" pseudo-pill representing settlements, which have no real
 * Category row of their own. */
export default function GroupCategoryFilterPills({ groupId, value, onChange }: GroupCategoryFilterPillsProps) {
  const categories = useGroupUsedCategoriesQuery(groupId).data ?? []

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
      <Pill label="All" isSelected={value === 'all'} onClick={() => onChange('all')} />
      {categories.map((cat) => {
        const Icon = iconForCategory(cat.icon)
        return (
          <Pill
            key={cat.id}
            label={cat.name}
            icon={<Icon size={14} style={{ color: cat.color }} strokeWidth={2} />}
            isSelected={value === cat.id}
            onClick={() => onChange(cat.id)}
          />
        )
      })}
      <Pill
        label="Payment"
        icon={<CreditCard size={14} strokeWidth={2} />}
        isSelected={value === 'payment'}
        onClick={() => onChange('payment')}
      />
    </div>
  )
}

function Pill({
  label,
  icon,
  isSelected,
  onClick,
}: {
  label: string
  icon?: ReactNode
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer border-[1.5px] shrink-0',
        isSelected
          ? 'bg-[#E4F2EB] border-[#0B683A4D] text-primary'
          : 'bg-white border-[#E8E5DE] text-[#1A1A1A] hover:bg-[#F7F5F0]',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
