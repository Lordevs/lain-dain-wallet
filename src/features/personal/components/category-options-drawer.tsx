import { createElement } from 'react'
import {
  ArrowUpDown,
  Trash2,
} from 'lucide-react'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { iconForCategory } from '@/features/expenses/lib/category-icons'
import { formatCurrency } from '@/lib/currency'

interface CategoryItem {
  id: string
  name: string
  icon: string
  color: string
  isSystem: boolean
  spent: number
  currency: string
}

interface CategoryOptionsDrawerProps {
  isOpen: boolean
  onClose: () => void
  category: CategoryItem | null
  onReorderClick: () => void
  onDeleteClick: (cat: CategoryItem) => void
}

/** System categories can't be deleted (see services.delete_category) —
 * only "Reorder" is offered for those; a custom category also gets
 * "Delete". There's no rename/recolor endpoint at all, so that option
 * isn't offered here regardless of category type. */
export default function CategoryOptionsDrawer({
  isOpen,
  onClose,
  category,
  onReorderClick,
  onDeleteClick,
}: CategoryOptionsDrawerProps) {
  if (!category) return null

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white rounded-t-[32px] pb-8 border-t-0 text-[#1A1A1A] outline-none">
        {/* Preview Header */}
        <div className="p-5 flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${category.color}1A`, color: category.color }}
          >
            {createElement(iconForCategory(category.icon), { size: 20, strokeWidth: 1.5 })}
          </div>
          <div className="flex flex-col text-left">
            <h3 className="text-[17px] font-extrabold text-[#1A1A1A] leading-tight">
              {category.name}
            </h3>
            <span className="text-[13px] font-medium text-[#6B6B6B] mt-1">
              {formatCurrency(category.spent, category.currency)} spent this month
            </span>
          </div>
        </div>

        <hr className="border-[#EBEBEB] border-b-[0.8px] w-full shrink-0" />

        {/* Options List */}
        <div className="divide-y-[0.8px]! divide-[#EBEBEB] flex flex-col">
          {/* Reorder Categories */}
          <button
            onClick={() => {
              onReorderClick()
              onClose()
            }}
            className="w-full py-4 px-6 flex items-center gap-4 hover:bg-muted/5 transition-colors cursor-pointer border-0 bg-transparent text-left outline-none"
          >
            <div className="w-10 h-10 rounded-[12px] bg-[#E4F2EB] text-positive flex items-center justify-center shrink-0">
              <ArrowUpDown size={18} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Reorder categories</span>
              <span className="text-[12px] font-normal text-[#6B6B6B] mt-0.5 leading-none">Change the display order</span>
            </div>
          </button>

          {/* Delete Category — custom categories only */}
          {!category.isSystem && (
            <button
              onClick={() => {
                onDeleteClick(category)
                onClose()
              }}
              className="w-full py-4 px-6 flex items-center gap-4 hover:bg-muted/5 transition-colors cursor-pointer border-0 bg-transparent text-left outline-none"
            >
              <div className="w-10 h-10 rounded-[12px] bg-[#FDF3F3] text-[#C0392B] flex items-center justify-center shrink-0">
                <Trash2 size={18} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-[#C0392B] leading-tight">Delete category</span>
                <span className="text-[12px] font-normal text-[#6B6B6B] mt-0.5 leading-none">Only if no expense uses it</span>
              </div>
            </button>
          )}

        </div>
      </DrawerContent>
    </Drawer>
  )
}
