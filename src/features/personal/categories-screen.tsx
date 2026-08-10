import { createElement, useState } from 'react'
import {
  AutoScrollActivator,
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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

interface SortableCategoryRowProps {
  category: Category
  spent: number
  currency: string
  isReordering: boolean
  onOpen: (category: Category) => void
}

function SortableCategoryRow({
  category,
  spent,
  currency,
  isReordering,
  onOpen,
}: SortableCategoryRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, disabled: !isReordering })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
        boxShadow: isDragging ? '0 10px 28px rgba(0, 0, 0, 0.12)' : undefined,
      }}
      className={cn(
        'relative flex items-center justify-between bg-white p-4 transition-[background-color,box-shadow] select-none',
        !isReordering && 'cursor-pointer hover:bg-muted/5',
        isDragging && 'scale-[1.015] rounded-[18px]',
      )}
      onClick={() => {
        if (!isReordering) onOpen(category)
      }}
    >
      <div className="flex min-w-0 flex-1 items-center">
        <button
          type="button"
          aria-label={`Reorder ${category.name}`}
          disabled={!isReordering}
          className={cn(
            'mr-1 flex shrink-0 flex-col gap-0.75 border-0 bg-transparent py-3 pl-1 pr-3 select-none',
            isReordering ? 'cursor-grab touch-none active:cursor-grabbing' : 'pointer-events-none',
          )}
          {...attributes}
          {...listeners}
        >
          <span className="h-[1.2px] w-3.5 rounded-full bg-[#C8C4BD]" />
          <span className="h-[1.2px] w-3.5 rounded-full bg-[#C8C4BD]" />
          <span className="h-[1.2px] w-3.5 rounded-full bg-[#C8C4BD]" />
        </button>

        <div
          className="mr-3.5 flex size-10 shrink-0 items-center justify-center rounded-[12px]"
          style={{ backgroundColor: `${category.color}1A`, color: category.color }}
        >
          {createElement(iconForCategory(category.icon), { size: 18, strokeWidth: 1.5 })}
        </div>

        <div className="flex min-w-0 flex-1 flex-col pr-1 text-left">
          <span className="text-[15px] leading-snug font-bold text-[#1A1A1A]">
            {category.name}
          </span>
          {!isReordering && (
            <span className="mt-0.5 text-[12.5px] leading-tight font-normal text-[#6B6B6B]">
              {formatCurrency(spent, currency)} spent this period
            </span>
          )}
        </div>
      </div>

      {!isReordering && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onOpen(category)
          }}
          className="flex shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-1.5 text-[#C8C4BD] transition-colors hover:text-[#1A1A1A]"
        >
          <MoreVertical size={16} />
        </button>
      )}
    </div>
  )
}

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
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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
    reorderCategories.mutate(draftOrder.map((c) => c.id), {
      onSuccess: () => {
        setIsReordering(false)
        toast.success('Category order updated')
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return

    setDraftOrder((current) => {
      const oldIndex = current.findIndex((category) => category.id === active.id)
      const newIndex = current.findIndex((category) => category.id === over.id)
      return oldIndex < 0 || newIndex < 0 ? current : arrayMove(current, oldIndex, newIndex)
    })
  }

  const isLoading = categoryBudgetsQuery.isLoading

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#FEFAF1] text-left select-none">
      {/* Top Header */}
      <FlowHeader
        title="Manage Categories"
        backVariant="circle"
        onBack={isReordering ? () => setIsReordering(false) : undefined}
        rightSlot={
          isReordering ? (
            <button
              onClick={handleDoneReordering}
              disabled={reorderCategories.isPending}
              className="text-positive font-extrabold text-[15px] cursor-pointer hover:opacity-80 transition-opacity p-2 border-0 bg-transparent disabled:cursor-not-allowed disabled:opacity-40"
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
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-10">

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
          <div className={cn(
            "mx-6 bg-white border border-[#EFE7DD] rounded-[24px] shadow-[0px_2px_10px_0px_#0000000D] mb-6",
            isReordering ? "overflow-visible" : "overflow-hidden",
          )}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              autoScroll={{
                enabled: isReordering,
                activator: AutoScrollActivator.Pointer,
                threshold: { x: 0.05, y: 0.18 },
                acceleration: 12,
                interval: 5,
                layoutShiftCompensation: true,
              }}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayList.map((category) => category.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y divide-[#EFE7DD]">
                  {displayList.map((category) => (
                    <SortableCategoryRow
                      key={category.id}
                      category={category}
                      spent={spentByCategory.get(category.id) ?? 0}
                      currency={currency}
                      isReordering={isReordering}
                      onOpen={setSelectedCategory}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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
        <div className="app-fullscreen z-50 overflow-hidden bg-[#FEFAF1]">
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
