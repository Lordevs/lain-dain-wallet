import {
  ArrowUpDown,
  EyeOff,
  Pencil,
  Trash2,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Drawer, DrawerContent } from '@/components/ui/drawer'

interface CategoryItem {
  id: string
  name: string
  expensesCount: number
  totalAmount: number
  icon: any
  iconBg: string
  iconColor: string
  isHidden?: boolean
}

interface CategoryOptionsDrawerProps {
  isOpen: boolean
  onClose: () => void
  category: CategoryItem | null
  onHideShow: (catId: string) => void
  onReorderClick: () => void
  onDeleteClick: (cat: CategoryItem) => void
}

export default function CategoryOptionsDrawer({
  isOpen,
  onClose,
  category,
  onHideShow,
  onReorderClick,
  onDeleteClick,
}: CategoryOptionsDrawerProps) {
  if (!category) return null

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white rounded-t-[32px] pb-8 border-t-0 text-[#1A1A1A] outline-none">
        {/* Preview Header */}
        <div className="p-5 flex items-center gap-4">
          <div className={cn("w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0", category.iconBg, category.iconColor)}>
            <category.icon size={20} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col text-left">
            <h3 className="text-[17px] font-extrabold text-[#1A1A1A] leading-tight">
              {category.name}
            </h3>
            <span className="text-[13px] font-medium text-[#6B6B6B] mt-1">
              {category.expensesCount} expenses · Rs. {category.totalAmount.toLocaleString()} this month
            </span>
          </div>
        </div>

        <hr className="border-[#EBEBEB] border-b-[0.8px] w-full shrink-0" />

        {/* Options List */}
        <div className="divide-y-[0.8px]! divide-[#EBEBEB] flex flex-col">

          {/* Hide / Show Category */}
          <button
            onClick={() => {
              onHideShow(category.id)
              onClose()
            }}
            className="w-full py-4 px-6 flex items-center gap-4 hover:bg-muted/5 transition-colors cursor-pointer border-0 bg-transparent text-left outline-none"
          >
            <div className="w-10 h-10 rounded-[12px] bg-[#E4F2EB] text-[#0B683A] flex items-center justify-center shrink-0">
              <EyeOff size={18} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">
                {category.isHidden ? 'Show category' : 'Hide category'}
              </span>
              <span className="text-[12px] font-normal text-[#6B6B6B] mt-0.5 leading-none">
                {category.isHidden ? 'Will appear in the expense picker' : "Won't appear in the expense picker"}
              </span>
            </div>
          </button>

          {/* Rename Category */}
          <button
            onClick={onClose}
            className="w-full py-4 px-6 flex items-center gap-4 hover:bg-muted/5 transition-colors cursor-pointer border-0 bg-transparent text-left outline-none"
          >
            <div className="w-10 h-10 rounded-[12px] bg-[#E4F2EB] text-[#0B683A] flex items-center justify-center shrink-0">
              <Pencil size={18} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Rename category</span>
              <span className="text-[12px] font-normal text-[#6B6B6B] mt-0.5 leading-none">Change the display name</span>
            </div>
          </button>

          {/* Set Monthly Cycle */}
          <button
            onClick={onClose}
            className="w-full py-4 px-6 flex items-center gap-4 hover:bg-muted/5 transition-colors cursor-pointer border-0 bg-transparent text-left outline-none"
          >
            <div className="w-10 h-10 rounded-[12px] bg-[#FFF9E6] text-[#C85A00] flex items-center justify-center shrink-0">
              <Calendar size={18} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Set monthly cycle</span>
              <span className="text-[12px] font-normal text-[#6B6B6B] mt-0.5 leading-none">Reset tracking on a chosen day e.g. 1st</span>
            </div>
          </button>

          {/* Reorder Categories */}
          <button
            onClick={() => {
              onReorderClick()
              onClose()
            }}
            className="w-full py-4 px-6 flex items-center gap-4 hover:bg-muted/5 transition-colors cursor-pointer border-0 bg-transparent text-left outline-none"
          >
            <div className="w-10 h-10 rounded-[12px] bg-[#E4F2EB] text-[#0B683A] flex items-center justify-center shrink-0">
              <ArrowUpDown size={18} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">Reorder categories</span>
              <span className="text-[12px] font-normal text-[#6B6B6B] mt-0.5 leading-none">Change the display order</span>
            </div>
          </button>

          {/* Delete Category */}
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
              <span className="text-[12px] font-normal text-[#6B6B6B] mt-0.5 leading-none">Expenses move to Other</span>
            </div>
          </button>

        </div>
      </DrawerContent>
    </Drawer>
  )
}
