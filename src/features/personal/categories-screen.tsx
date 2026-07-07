import { useState } from 'react'
import { Reorder } from 'framer-motion'
import {
  ShoppingCart,
  Truck,
  ShoppingBag,
  Receipt,
  Video,
  Heart,
  Fuel,
  Info,
  Plus,
  MoreVertical,
  Calendar,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import FlowHeader from '@/components/shared/flow-header'
import ConfirmActionDrawer from '@/components/shared/confirm-action-drawer'
import CategoryOptionsDrawer from './components/category-options-drawer'

interface CategoryItem {
  id: string
  name: string
  expensesCount: number
  totalAmount: number
  icon: any
  iconBg: string
  iconColor: string
  isHidden?: boolean
  badges?: Array<{
    label: string
    type: 'cycle' | 'budget'
  }>
}

const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'grocery',
    name: 'Grocery',
    expensesCount: 15,
    totalAmount: 18200,
    icon: ShoppingCart,
    iconBg: 'bg-[#E8F5E9]',
    iconColor: 'text-[#27AE60]',
    badges: [
      { label: 'Monthly cycle · 1st', type: 'cycle' },
      { label: 'Budget: Rs. 12,000', type: 'budget' }
    ]
  },
  {
    id: 'transport',
    name: 'Transport',
    expensesCount: 12,
    totalAmount: 8400,
    icon: Truck,
    iconBg: 'bg-[#FFF3E0]',
    iconColor: 'text-[#E28743]',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    expensesCount: 7,
    totalAmount: 12600,
    icon: ShoppingBag,
    iconBg: 'bg-[#F3E5F5]',
    iconColor: 'text-[#9B59B6]',
  },
  {
    id: 'bills',
    name: 'Bills',
    expensesCount: 4,
    totalAmount: 6500,
    icon: Receipt,
    iconBg: 'bg-[#F5F5F5]',
    iconColor: 'text-[#7F8C8D]',
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    expensesCount: 3,
    totalAmount: 2550,
    icon: Video,
    iconBg: 'bg-[#FFF3E0]/70',
    iconColor: 'text-[#E28743]/70',
    isHidden: true
  },
  {
    id: 'health',
    name: 'Health',
    expensesCount: 2,
    totalAmount: 1800,
    icon: Heart,
    iconBg: 'bg-[#FFEAEA]',
    iconColor: 'text-[#E74C3C]',
  },
  {
    id: 'fuel',
    name: 'Fuel',
    expensesCount: 9,
    totalAmount: 7200,
    icon: Fuel,
    iconBg: 'bg-[#FFF3E0]',
    iconColor: 'text-[#D35400]',
  },
  {
    id: 'other',
    name: 'Other',
    expensesCount: 2,
    totalAmount: 950,
    icon: Info,
    iconBg: 'bg-[#F5F5F5]',
    iconColor: 'text-[#7F8C8D]',
  }
]

export default function PersonalCategoriesScreen() {
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES)
  const [isReordering, setIsReordering] = useState(false)
  const [selectedCategoryOptions, setSelectedCategoryOptions] = useState<CategoryItem | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null)

  const handleReorder = (newOrder: CategoryItem[]) => {
    setCategories(newOrder)
  }

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-6 select-none overflow-hidden text-left">
      {/* Top Header */}
      <FlowHeader
        title="Manage Categories"
        backVariant="circle"
        onBack={isReordering ? () => setIsReordering(false) : undefined}
        rightSlot={
          isReordering ? (
            <button
              onClick={() => setIsReordering(false)}
              className="text-positive font-extrabold text-[15px] cursor-pointer hover:opacity-80 transition-opacity p-2 border-0 bg-transparent"
            >
              Done
            </button>
          ) : undefined
        }
      />

      {/* Description Text or Reorder Helper Banner */}
      {isReordering ? (
        <div className="mx-6 bg-[#E8F2EC] rounded-[16px] py-3.5 px-4 flex items-center justify-center gap-2 mb-5 border border-[#0B683A0F] shrink-0">
          <ArrowUpDown size={16} className="text-positive" />
          <span className="text-sm font-extrabold text-positive">
            Hold and drag a row to reorder
          </span>
        </div>
      ) : (
        <p className="text-[13px] font-normal text-[#6B6B6B] px-6 mt-1 mb-3 leading-relaxed shrink-0">
          Tap ... on any category to rename, hide, reorder or set a monthly budget cycle.
        </p>
      )}

      {/* Settings Scroll Area */}
      <div className="flex-1 overflow-y-auto pb-4">

        {/* Section Title */}
        <h4 className="text-[11px] font-semibold text-[#6B6B6B] tracking-widest mb-1 px-7 uppercase">
          Your Categories ({categories.length})
        </h4>

        {/* Draggable/Tappable Category List */}
        <div className="mx-6 bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_2px_10px_0px_#0000000D] overflow-hidden mb-6">
          <Reorder.Group
            axis="y"
            values={categories}
            onReorder={handleReorder}
            className="divide-y divide-[#EFE7DD]"
          >
            {categories.map((cat, index) => {
              const Icon = cat.icon
              const isFirstGrocery = isReordering && index === 0

              return (
                <Reorder.Item
                  key={cat.id}
                  value={cat}
                  dragListener={isReordering}
                  as="div"
                  className={cn(
                    "p-4 flex items-center justify-between transition-colors bg-white select-none",
                    !isReordering && "hover:bg-muted/5 cursor-pointer",
                    cat.isHidden && "opacity-80",
                    isFirstGrocery && "bg-[#E8F2EC]/60"
                  )}
                  onClick={() => {
                    if (!isReordering) {
                      setSelectedCategoryOptions(cat)
                    }
                  }}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    {/* Drag Handle (Compact custom handle) */}
                    <div className="flex flex-col gap-0.75 pr-3 pl-1 py-2 shrink-0 select-none">
                      <div className={cn("w-3.5 h-[1.2px] rounded-full", isFirstGrocery ? "bg-positive" : "bg-[#C8C4BD]")} />
                      <div className={cn("w-3.5 h-[1.2px] rounded-full", isFirstGrocery ? "bg-positive" : "bg-[#C8C4BD]")} />
                      <div className={cn("w-3.5 h-[1.2px] rounded-full", isFirstGrocery ? "bg-positive" : "bg-[#C8C4BD]")} />
                    </div>

                    {/* Icon Squircle */}
                    <div className={cn("w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 mr-3.5", cat.iconBg, cat.iconColor)}>
                      <Icon size={18} strokeWidth={1.5} />
                    </div>

                    {/* Info Block */}
                    <div className="flex flex-col text-left flex-1 min-w-0 pr-1">
                      <div className="flex items-center flex-wrap">
                        <span
                          className={cn(
                            "font-bold text-[15px] text-[#1A1A1A] leading-snug",
                            cat.isHidden && "text-[#1A1A1A]/55",
                            isFirstGrocery && "text-positive"
                          )}
                        >
                          {cat.name}
                        </span>
                        {cat.isHidden && (
                          <span className="bg-[#ECEAE4] text-[#6B6B6B] text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] ml-1.5 shrink-0">
                            Hidden
                          </span>
                        )}
                      </div>

                      <span className={cn("text-[12.5px] font-normal text-[#6B6B6B] mt-0.5 leading-tight", cat.isHidden && "text-[#6B6B6B]/60")}>
                        {cat.expensesCount} expenses
                        {!isReordering && ` · Rs. ${cat.totalAmount.toLocaleString()}`}
                      </span>

                      {/* Optional Badges (only in Normal view) */}
                      {!isReordering && cat.badges && cat.badges.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {cat.badges.map((b, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "text-[10px] font-semibold px-2.5 rounded-full shrink-0 flex items-center gap-1",
                                b.type === 'cycle'
                                  ? "bg-[#FFF9E6] border-[0.8px] border-[#C85A0026] text-[#C85A00]"
                                  : "bg-[#F0FDF4] border-[0.8px] border-[#0B683A26] text-positive"
                              )}
                            >
                              {b.type === 'cycle' && <Calendar size={10} strokeWidth={1.5} />}
                              {b.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3 dots action button (only in Normal view) */}
                  {!isReordering && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCategoryOptions(cat)
                      }}
                      className="text-[#C8C4BD] p-1.5 cursor-pointer bg-transparent border-0 hover:text-[#1A1A1A] transition-colors shrink-0 flex items-center justify-center"
                    >
                      <MoreVertical size={16} />
                    </button>
                  )}
                </Reorder.Item>
              )
            })}
          </Reorder.Group>
        </div>

        {/* Add New Category button card (only in Normal view) */}
        {!isReordering && (
          <div
            role="button"
            tabIndex={0}
            className="mx-6 bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_2px_10px_0px_#0000000D] p-5 flex items-center gap-4 cursor-pointer hover:bg-muted/5 transition-colors mb-6 text-left"
          >
            {/* Plus icon inside dashed border green squircle */}
            <div className="w-11 h-11 rounded-[16px] border-2 border-dashed border-[#0B683A33] bg-[#E8F5E9]/30 flex items-center justify-center text-positive shrink-0">
              <Plus size={20} strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-bold text-[15px] text-positive leading-tight">
                Add New Category
              </p>
              <p className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-none">
                Custom name, icon and colour
              </p>
            </div>
          </div>
        )}

        {/* Alert Banner (only in Normal view) */}
        {!isReordering && (
          <div className="mx-6 p-4 rounded-[20px] bg-[#E8F2EC] border-[0.8px] border-[#0B683A1F] text-positive flex items-start gap-3 text-left">
            <AlertCircle size={18} className="text-positive shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
              Deleting a category won't delete its expenses — they'll move to <span className="font-bold text-positive">Other</span>.
            </p>
          </div>
        )}

      </div>

      {/* Category Actions Bottom Drawer */}
      <CategoryOptionsDrawer
        isOpen={!!selectedCategoryOptions}
        onClose={() => setSelectedCategoryOptions(null)}
        category={selectedCategoryOptions}
        onReorderClick={() => setIsReordering(true)}
        onDeleteClick={(cat) => setCategoryToDelete(cat)}
      />

      {/* Delete Category Confirmation Drawer */}
      {categoryToDelete && (
        <ConfirmActionDrawer
          isOpen={!!categoryToDelete}
          onClose={() => setCategoryToDelete(null)}
          title="Delete Category"
          confirmTitle="Delete Category"
          confirmDescription={`Are you sure you want to delete the "${categoryToDelete.name}" category? All expenses belonging to it will be reassigned to "Other".`}
          buttonText="Delete Category"
          variant="danger"
          onConfirm={() => {
            setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id))
            setCategoryToDelete(null)
          }}
        />
      )}
    </div>
  )
}
