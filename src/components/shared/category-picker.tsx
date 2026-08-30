import { useState } from 'react'
import { Plus, type LucideIcon } from 'lucide-react'
import AddCategoryFlow from '@/components/shared/add-category-flow'
import { useDrawerBackHandler } from '@/hooks/use-drawer-back-handler'
import { useCategoriesQuery } from '@/features/expenses/api/use-categories-query'
import { useCreateCategoryMutation } from '@/features/expenses/api/use-create-category-mutation'
import { iconForCategory } from '@/features/expenses/lib/category-icons'

// Moved here from features/personal/components/ — this picker is used by
// shared expense components and the groups feature too, not just
// personal, so it belongs in shared, not scoped to one feature.
//
// Re-exported for static icon metadata used by a few secondary previews.
// Actual category selection uses the backend category UUID, because icons
// are presentation values and are not unique.
export interface CategoryOption {
  id: string
  label: string
  color: string
  icon: LucideIcon
}

export const CATEGORIES: CategoryOption[] = [
  { id: 'transport', label: 'Transport', color: '#C96A1B', icon: iconForCategory('transport') },
  { id: 'food', label: 'Food', color: '#D35400', icon: iconForCategory('food') },
  { id: 'shopping', label: 'Shopping', color: '#7D3C98', icon: iconForCategory('shopping') },
  { id: 'grocery', label: 'Grocery', color: '#27AE60', icon: iconForCategory('grocery') },
  { id: 'bills', label: 'Bills', color: '#16A085', icon: iconForCategory('bills') },
  { id: 'health', label: 'Health', color: '#C0392B', icon: iconForCategory('health') },
  { id: 'entertainment', label: 'Entertainment', color: '#D35400', icon: iconForCategory('entertainment') },
  { id: 'fuel', label: 'Fuel', color: '#F39C12', icon: iconForCategory('fuel') },
  { id: 'other', label: 'Other', color: '#7F8C8D', icon: iconForCategory('other') },
]

interface CategoryPickerProps {
  /** The category's unique backend UUID. */
  selectedCategoryId: string
  onSelectCategory: (categoryId: string) => void
  onAddCategoryOpenChange?: (isOpen: boolean) => void
}

export default function CategoryPicker({
  selectedCategoryId,
  onSelectCategory,
  onAddCategoryOpenChange,
}: CategoryPickerProps) {
  const categoriesQuery = useCategoriesQuery()
  const createCategory = useCreateCategoryMutation()
  const [showAddCategory, setShowAddCategory] = useState(false)

  const closeAddCategory = useDrawerBackHandler(showAddCategory, () => {
    setShowAddCategory(false)
    onAddCategoryOpenChange?.(false)
  })

  const openAddCategory = () => {
    setShowAddCategory(true)
    onAddCategoryOpenChange?.(true)
  }

  const handleSaveCategory = (name: string, icon: string, color: string) => {
    createCategory.mutate(
      { name, icon, color },
      {
        onSuccess: (category) => {
          onSelectCategory(category.id)
          closeAddCategory()
        },
      },
    )
  }

  const categories = categoriesQuery.data ?? []

  return (
    <div className="flex flex-wrap gap-2.5">
      {categoriesQuery.isLoading && (
        <p className="text-xs text-muted-foreground">Loading categories...</p>
      )}
      {categories.map((cat) => {
        const IconComponent = iconForCategory(cat.icon)
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
            {cat.name}
          </button>
        )
      })}

      {/* Add Category Pill */}
      <button
        type="button"
        onClick={openAddCategory}
        className="flex items-center gap-1.5 px-4 py-2.5 bg-transparent rounded-full text-[13px] font-medium text-primary border-[1.5px] border-dashed border-[#E8E5DE] cursor-pointer hover:bg-[#E4F2EB]/40 transition-all"
      >
        <Plus size={14} strokeWidth={2.5} />
        Add Category
      </button>

      {/* Add Category Flow Overlay */}
      {showAddCategory && (
        <div className="app-fullscreen z-50 overflow-hidden bg-[#FEFAF1]">
          <AddCategoryFlow
            isOpen={showAddCategory}
            onClose={closeAddCategory}
            onSave={handleSaveCategory}
            showHeader={true}
            isSaving={createCategory.isPending}
          />
        </div>
      )}
    </div>
  )
}
