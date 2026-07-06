import { useNavigate } from '@tanstack/react-router'
import {
  ShoppingCart,
  Truck,
  ShoppingBag,
  Receipt,
  Fuel,
  Heart,
  Video,
  Info,
  AlertTriangle
} from 'lucide-react'
import { useContactStore } from '@/store/use-contact-store'
import FlowHeader from '@/components/shared/flow-header'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { ROUTES } from '@/constants/routes'

interface CategoryDefinition {
  id: string
  name: string
  icon: any
  iconBg: string
  iconColor: string
  spent: number
  isHidden?: boolean
}

const CATEGORY_DEFS: CategoryDefinition[] = [
  {
    id: 'grocery',
    name: 'Grocery',
    icon: ShoppingCart,
    iconBg: 'bg-[#E8F5E9]',
    iconColor: 'text-[#27AE60]',
    spent: 9200
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: Truck,
    iconBg: 'bg-[#FFF3E0]',
    iconColor: 'text-[#E28743]',
    spent: 4200
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: ShoppingBag,
    iconBg: 'bg-[#F3E5F5]',
    iconColor: 'text-[#9B59B6]',
    spent: 6500
  },
  {
    id: 'bills',
    name: 'Bills',
    icon: Receipt,
    iconBg: 'bg-[#F5F5F5]',
    iconColor: 'text-[#7F8C8D]',
    spent: 5600
  },
  {
    id: 'fuel',
    name: 'Fuel',
    icon: Fuel,
    iconBg: 'bg-[#FFF9E6]',
    iconColor: 'text-[#D35400]',
    spent: 3200
  },
  {
    id: 'health',
    name: 'Health',
    icon: Heart,
    iconBg: 'bg-[#FFEAEA]',
    iconColor: 'text-[#E74C3C]',
    spent: 950
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: Video,
    iconBg: 'bg-[#F5F5F5]',
    iconColor: 'text-[#9A9590]',
    spent: 0,
    isHidden: true
  },
  {
    id: 'other',
    name: 'Other',
    icon: Info,
    iconBg: 'bg-[#F5F5F5]',
    iconColor: 'text-[#7F8C8D]',
    spent: 0
  }
]

export default function CategoryBudgetsScreen() {
  const navigate = useNavigate()
  const { categoryBudgets } = useContactStore()

  const handleSaveAll = () => {
    window.history.back()
  }

  // Calculate totals
  const totalBudgets = CATEGORY_DEFS.reduce((sum, cat) => sum + (categoryBudgets[cat.id] ?? 0), 0)
  const totalSpent = CATEGORY_DEFS.reduce((sum, cat) => sum + cat.spent, 0)
  const totalSpentPercentage = totalBudgets > 0 ? Math.min(100, Math.round((totalSpent / totalBudgets) * 100)) : 0

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none overflow-hidden text-[#1A1A1A]">
      {/* Top Header */}
      <FlowHeader
        title="Category Budgets"
        backVariant="circle"
        rightSlot={
          <button
            onClick={handleSaveAll}
            className="text-positive font-bold text-base bg-transparent border-0 cursor-pointer outline-none hover:opacity-85"
          >
            Save
          </button>
        }
      />

      {/* Main Scroll Container */}
      <div className="flex-1 overflow-y-auto px-6 pb-28 flex flex-col gap-5 mt-2">
        {/* Total category budgets Card */}
        <div className="bg-white border border-[#EBEBEB] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-5 flex flex-col text-left">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#6B6B6B]">
              Total category budgets
            </span>
            <span className="text-[20px] font-extrabold text-[#1A1A1A]">
              Rs. {totalBudgets.toLocaleString('en-US')}
            </span>
          </div>

          {/* Combined Progress Bar */}
          <Progress
            value={totalSpentPercentage}
            className="w-full h-1.5 bg-[#F2EFEA] mt-4"
            indicatorClassName="bg-positive"
          />

          <span className="text-[12px] font-normal text-[#6B6B6B] mt-2.5">
            Rs. {totalSpent.toLocaleString('en-US')} spent across all categories
          </span>
        </div>

        {/* Set Limits Section */}
        <div className="flex flex-col text-left">
          <h4 className="text-[11px] font-semibold text-[#6B6B6B] tracking-[0.8px] mb-2.5 px-1 uppercase">
            Set limits per category
          </h4>

          <div className="bg-white border-[1.5px] border-[#EBEBEB] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y-[1.5px] divide-[#EBEBEB] overflow-hidden">
            {CATEGORY_DEFS.map((cat) => {
              const limit = categoryBudgets[cat.id] ?? 0
              const isLimitSet = limit > 0
              const spentPercent = isLimitSet ? Math.round((cat.spent / limit) * 100) : 0
              const isOverBudget = isLimitSet && cat.spent > limit
              const isNearLimit = isLimitSet && !isOverBudget && spentPercent >= 80

              const Icon = cat.icon

              return (
                <div
                  key={cat.id}
                  onClick={() => navigate({
                    to: ROUTES.PERSONAL_SET_CATEGORY_LIMIT,
                    params: { catId: cat.id }
                  })}
                  className="p-5 flex items-center gap-4 transition-colors hover:bg-muted/5 cursor-pointer"
                >
                  {/* Icon Block */}
                  <div className={cn("w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0", cat.iconBg)}>
                    <Icon className={cn("w-5 h-5", cat.iconColor)} strokeWidth={2.5} />
                  </div>

                  {/* Details Block */}
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={cn(
                          "text-[15px] font-semibold text-[#1A1A1A] truncate leading-tight",
                          cat.isHidden && "text-[#9A9590]"
                        )}>
                          {cat.name}
                        </span>
                        {cat.isHidden && (
                          <span className="bg-[#F2EFEA] text-[#9A9590] text-[10px] px-1.5 py-0.5 rounded-[6px] font-bold shrink-0">
                            Hidden
                          </span>
                        )}
                      </div>

                      {/* Spend / Limit Text */}
                      {isLimitSet ? (
                        <span className={cn(
                          "text-[14px] font-bold leading-tight shrink-0",
                          isOverBudget ? "text-[#C0392B]" : isNearLimit ? "text-[#C96A1B]" : "text-positive"
                        )}>
                          Rs. {cat.spent.toLocaleString('en-US')} / {limit.toLocaleString('en-US')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="text-positive font-bold text-[14px] border-0 bg-transparent cursor-pointer p-1"
                        >
                          + Set limit
                        </button>
                      )}
                    </div>

                    {/* Progress Bar (If limit is set) */}
                    {isLimitSet && (
                      <Progress
                        value={spentPercent}
                        className="w-full h-1.5 bg-[#F2EFEA] mt-2.5"
                        indicatorClassName={cn(
                          isOverBudget ? "bg-[#C0392B]" : isNearLimit ? "bg-[#C96A1B]" : "bg-positive"
                        )}
                      />
                    )}

                    {/* Alert / Details helper text */}
                    {isLimitSet && (
                      <div className="mt-1.5 flex items-center min-w-0">
                        {isOverBudget ? (
                          <span className="text-[#C0392B] text-[12px] font-semibold flex items-center gap-1 leading-normal">
                            <AlertTriangle size={12} className="shrink-0" />
                            Rs. {(cat.spent - limit).toLocaleString('en-US')} over budget
                          </span>
                        ) : (
                          <span className={cn(
                            "text-[12px] font-normal leading-normal",
                            isNearLimit ? "text-[#C96A1B]" : "text-[#6B6B6B]"
                          )}>
                            {spentPercent}% used · Rs. {(limit - cat.spent).toLocaleString('en-US')} left
                          </span>
                        )}
                      </div>
                    )}

                    {!isLimitSet && (
                      <span className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-normal">
                        Rs. {cat.spent.toLocaleString('en-US')} spent · no limit
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Save Category Budgets button */}
      <div className="fixed bottom-3 left-3 right-3 z-10">
        <Button
          onClick={handleSaveAll}
          className="w-full max-w-md h-14 rounded-full bg-positive hover:bg-positive/95 text-white font-bold text-base"
        >
          Save Category Budgets
        </Button>
      </div>
    </div>
  )
}
