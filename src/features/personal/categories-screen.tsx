import { createElement, useState } from 'react'
import { Reorder } from 'framer-motion'
import { toast } from 'sonner'
import {
  Plus,
  MoreVertical,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/currency'
import FlowHeader from '@/components/shared/flow-header'
import ConfirmActionDrawer from '@/components/shared/confirm-action-drawer'
import CategoryOptionsDrawer from './components/category-options-drawer'
import AddCategoryFlow from '@/components/shared/add-category-flow'
import { useDrawerBackHandler } from '@/hooks/use-drawer-back-handler'
import { Skeleton } from '@/components/ui/skeleton'
import { iconForCategory } from '@/features/expenses/lib/category-icons'
import { useCategoryBudgetsQuery } from '@/features/expenses/api/use-category-budgets-query'
import { useCreateCategoryMutation } from '@/features/expenses/api/use-create-category-mutation'
import { useDeleteCategoryMutation } from '@/features/expenses/api/use-delete-category-mutation'
import { useReorderCategoriesMutation } from '@/features/expenses/api/use-reorder-categories-mutation'
import type { components } from '@/lib/api/schema'

type Category = components['schemas']['Category']

export default function PersonalCategoriesScreen() {
  const categoryBudgetsQuery = useCategoryBudgetsQuery()
  const createCategory = useCreateCategoryMutation()
  const deleteCategory = useDeleteCategoryMutation()
  const reorderCategories = useReorderCategoriesMutation()

  const [isReordering, setIsReordering] = useState(false)
  const [draftOrder, setDraftOrder] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)

  const closeAddCategory = useDrawerBackHandler(showAddCategory, () => setShowAddCategory(false))

  const categories = categoryBudgetsQuery.data?.categories.map((row) => row.category) ?? []
  const spentByCategory = new Map(
    (categoryBudgetsQuery.data?.categories ?? []).map((row) => [row.category.id, Number(row.spent)]),
  )
  const currency = categoryBudgetsQuery.data?.currency ?? 'PKR'

  // Displays the live query order normally; while actively dragging, the
  // draft copy takes over so Reorder.Group can mutate it locally without
  // hitting the server on every intermediate position — only "Done" saves.
  const displayList = isReordering ? draftOrder : categories

  const handleSaveCategory = (name: string, icon: string, color: string) => {
    createCategory.mutate({ name, icon, color }, { onSuccess: () => closeAddCategory() })
  }

  const handleStartReordering = () => {
    setDraftOrder(categories)
    setIsReordering(true)
  }

  const handleDoneReordering = () => {
    setIsReordering(false)
    reorderCategories.mutate(draftOrder.map((c) => c.id))
  }

  const isLoading = categoryBudgetsQuery.isLoading

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
              onClick={handleDoneReordering}
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
          Tap ... on any category to reorder or delete it.
        </p>
      )}

      {/* Settings Scroll Area */}
      <div className="flex-1 overflow-y-auto pb-4">

        {/* Section Title */}
        <h4 className="text-[11px] font-semibold text-[#6B6B6B] tracking-widest mb-1 px-7 uppercase">
          Your Categories ({categories.length})
        </h4>

        {/* Draggable/Tappable Category List */}
        {isLoading ? (
          <div className="mx-6 bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_2px_10px_0px_#0000000D] overflow-hidden mb-6 divide-y divide-[#EFE7DD]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-3.5">
                <Skeleton className="w-10 h-10 rounded-[12px] shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-6 bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_2px_10px_0px_#0000000D] overflow-hidden mb-6">
            <Reorder.Group
              axis="y"
              values={displayList}
              onReorder={setDraftOrder}
              className="divide-y divide-[#EFE7DD]"
            >
              {displayList.map((cat) => {
                const spent = spentByCategory.get(cat.id) ?? 0

                return (
                  <Reorder.Item
                    key={cat.id}
                    value={cat}
                    dragListener={isReordering}
                    as="div"
                    className={cn(
                      "p-4 flex items-center justify-between transition-colors bg-white select-none",
                      !isReordering && "hover:bg-muted/5 cursor-pointer",
                    )}
                    onClick={() => {
                      if (!isReordering) {
                        setSelectedCategory(cat)
                      }
                    }}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      {/* Drag Handle (Compact custom handle) */}
                      <div className="flex flex-col gap-0.75 pr-3 pl-1 py-2 shrink-0 select-none">
                        <div className="w-3.5 h-[1.2px] rounded-full bg-[#C8C4BD]" />
                        <div className="w-3.5 h-[1.2px] rounded-full bg-[#C8C4BD]" />
                        <div className="w-3.5 h-[1.2px] rounded-full bg-[#C8C4BD]" />
                      </div>

                      {/* Icon Squircle */}
                      <div
                        className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 mr-3.5"
                        style={{ backgroundColor: `${cat.color}1A`, color: cat.color }}
                      >
                        {createElement(iconForCategory(cat.icon), { size: 18, strokeWidth: 1.5 })}
                      </div>

                      {/* Info Block */}
                      <div className="flex flex-col text-left flex-1 min-w-0 pr-1">
                        <span className="font-bold text-[15px] text-[#1A1A1A] leading-snug">
                          {cat.name}
                        </span>
                        <span className="text-[12.5px] font-normal text-[#6B6B6B] mt-0.5 leading-tight">
                          {!isReordering && `${formatCurrency(spent, currency)} spent this period`}
                        </span>
                      </div>
                    </div>

                    {/* 3 dots action button (only in Normal view) */}
                    {!isReordering && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCategory(cat)
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
        )}

        {/* Add New Category button card (only in Normal view) */}
        {!isReordering && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setShowAddCategory(true)}
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
              A category can only be deleted once no expense still uses it — otherwise, reassign those expenses first.
            </p>
          </div>
        )}

      </div>

      {/* Category Actions Bottom Drawer */}
      <CategoryOptionsDrawer
        isOpen={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        category={
          selectedCategory && {
            id: selectedCategory.id,
            name: selectedCategory.name,
            icon: selectedCategory.icon,
            color: selectedCategory.color,
            isSystem: selectedCategory.is_system,
            spent: spentByCategory.get(selectedCategory.id) ?? 0,
            currency,
          }
        }
        onReorderClick={handleStartReordering}
        onDeleteClick={(cat) => setCategoryToDelete(categories.find((c) => c.id === cat.id) ?? null)}
      />

      {/* Delete Category Confirmation Drawer */}
      {categoryToDelete && (
        <ConfirmActionDrawer
          isOpen={!!categoryToDelete}
          onClose={() => setCategoryToDelete(null)}
          title="Delete Category"
          confirmTitle="Delete Category"
          confirmDescription={`Are you sure you want to delete the "${categoryToDelete.name}" category? This only works if no expense currently uses it.`}
          buttonText="Delete Category"
          variant="danger"
          onConfirm={() => {
            const name = categoryToDelete.name
            deleteCategory.mutate(categoryToDelete.id, {
              onSuccess: () => {
                setCategoryToDelete(null)
                toast.success(`"${name}" deleted`)
              },
              onError: (err) => {
                setCategoryToDelete(null)
                toast.error(err.message)
              },
            })
          }}
        />
      )}

      {/* Add Custom Category Drawer Flow */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 bg-[#FEFAF1]">
          <AddCategoryFlow
            isOpen={showAddCategory}
            onClose={closeAddCategory}
            onSave={handleSaveCategory}
          />
        </div>
      )}
    </div>
  )
}
