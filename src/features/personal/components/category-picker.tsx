import {
  Bus,
  ShoppingBag,
  ShoppingCart,
  Receipt,
  Film,
  Activity,
  Fuel as FuelIcon,
  HelpCircle,
  Plus,
} from 'lucide-react'

export interface CategoryOption {
  id: string
  label: string
  color: string // color of icon
  icon: any
}

export const CATEGORIES: CategoryOption[] = [
  { id: 'transport', label: 'Transport', color: '#C96A1B', icon: Bus },
  { id: 'shopping', label: 'Shopping', color: '#7D3C98', icon: ShoppingBag },
  { id: 'grocery', label: 'Grocery', color: '#27AE60', icon: ShoppingCart },
  { id: 'bills', label: 'Bills', color: '#16A085', icon: Receipt },
  { id: 'entertainment', label: 'Entertainment', color: '#D35400', icon: Film },
  { id: 'health', label: 'Health', color: '#C0392B', icon: Activity },
  { id: 'fuel', label: 'Fuel', color: '#F39C12', icon: FuelIcon },
  { id: 'other', label: 'Other', color: '#7F8C8D', icon: HelpCircle },
]

interface CategoryPickerProps {
  selectedCategoryId: string
  onSelectCategory: (id: string) => void
}

export default function CategoryPicker({
  selectedCategoryId,
  onSelectCategory,
}: CategoryPickerProps) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {CATEGORIES.map((cat) => {
        const IconComponent = cat.icon
        const isSelected = selectedCategoryId === cat.id

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium transition-all cursor-pointer border-[1.5px] ${isSelected
              ? 'bg-[#E4F2EB] border-[#0B683A4D] text-primary'
              : 'bg-white border-[#E8E5DE] text-[#1A1A1A] hover:bg-[#F7F5F0]'
              }`}
          >
            <IconComponent size={18} style={{ color: cat.color }} strokeWidth={1.13} />
            {cat.label}
          </button>
        )
      })}

      {/* Add Category Pill */}
      <button
        type="button"
        onClick={() => console.log('add category clicked')}
        className="flex items-center gap-1.5 px-4 py-2.5 bg-transparent rounded-full text-[13px] font-medium text-primary border-[1.5px] border-dashed border-[#E8E5DE] cursor-pointer hover:bg-[#E4F2EB]/40 transition-all"
      >
        <Plus size={14} strokeWidth={2.5} />
        Add Category
      </button>
    </div>
  )
}
