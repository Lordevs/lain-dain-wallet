import { createElement } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'
import { useCategoryBudgetsQuery } from '@/features/expenses/api/use-category-budgets-query'
import { iconForCategory } from '@/features/expenses/lib/category-icons'
import CompactAmount from '@/components/shared/compact-amount'
import FlowHeader from '@/components/shared/flow-header'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/constants/routes'

export default function CategoryBudgetsScreen() {
  const navigate = useNavigate()
  const categoryBudgetsQuery = useCategoryBudgetsQuery()
  const data = categoryBudgetsQuery.data

  const currency = data?.currency ?? 'PKR'
  const totalBudget = data ? Number(data.total_budget) : 0
  const totalSpent = data ? Number(data.total_spent) : 0
  const totalSpentPercentage = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none overflow-hidden text-[#1A1A1A]">
      {/* Top Header */}
      <FlowHeader title="Category Budgets" backVariant="circle" />

      {/* Main Scroll Container */}
      <div className="flex-1 overflow-y-auto px-6 pb-10 flex flex-col gap-5 mt-2">
        {/* Total category budgets Card */}
        {!data ? (
          <Skeleton className="h-28 rounded-[24px]" />
        ) : (
          <div className="bg-white border border-[#EBEBEB] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-5 flex flex-col text-left">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#6B6B6B]">
                Total category budgets
              </span>
              <CompactAmount
                amount={totalBudget}
                currency={currency}
                drawerTitle="Total Category Budgets"
                className="text-[20px] font-extrabold text-[#1A1A1A]"
              />
            </div>

            {/* Combined Progress Bar */}
            <Progress
              value={totalSpentPercentage}
              className="w-full h-1.5 bg-[#F2EFEA] mt-4"
              indicatorClassName="bg-positive"
            />

            <span className="mt-2.5 flex items-center gap-1 text-[12px] font-normal text-[#6B6B6B]">
              <CompactAmount amount={totalSpent} currency={currency} drawerTitle="Total Category Spending" />
              <span>spent across all categories</span>
            </span>
          </div>
        )}

        {/* Set Limits Section */}
        <div className="flex flex-col text-left">
          <h4 className="text-[11px] font-semibold text-[#6B6B6B] tracking-[0.8px] mb-2.5 px-1 uppercase">
            Set limits per category
          </h4>

          {!data ? (
            <div className="bg-white border-[1.5px] border-[#EBEBEB] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y-[1.5px] divide-[#EBEBEB] overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-5 flex items-center gap-4">
                  <Skeleton className="w-11 h-11 rounded-[14px] shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border-[1.5px] border-[#EBEBEB] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y-[1.5px] divide-[#EBEBEB] overflow-hidden">
              {data.categories.map((row) => {
                const spent = Number(row.spent)
                const limit = row.limit_amount ? Number(row.limit_amount) : null
                const isLimitSet = limit !== null && limit > 0
                const spentPercent = isLimitSet ? Math.round((spent / limit) * 100) : 0
                const isOverBudget = isLimitSet && spent > limit
                const isNearLimit = isLimitSet && !isOverBudget && spentPercent >= 80

                return (
                  <div
                    key={row.category.id}
                    onClick={() => navigate({
                      to: ROUTES.PERSONAL_SET_CATEGORY_LIMIT,
                      params: { catId: row.category.id },
                    })}
                    className="p-5 flex items-center gap-4 transition-colors hover:bg-muted/5 cursor-pointer"
                  >
                    {/* Icon Block */}
                    <div
                      className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${row.category.color}1A`, color: row.category.color }}
                    >
                      {createElement(iconForCategory(row.category.icon), { size: 20, strokeWidth: 2.5 })}
                    </div>

                    {/* Details Block */}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[15px] font-semibold text-[#1A1A1A] truncate leading-tight">
                          {row.category.name}
                        </span>

                        {/* Spend / Limit Text */}
                        {isLimitSet ? (
                          <span className={cn(
                            "text-[14px] font-bold leading-tight shrink-0",
                            isOverBudget ? "text-[#C0392B]" : isNearLimit ? "text-[#C96A1B]" : "text-positive"
                          )}>
                            <CompactAmount
                              amount={spent}
                              currency={currency}
                              drawerTitle={`${row.category.name} Spending`}
                            />
                            {' / '}
                            <CompactAmount
                              amount={limit}
                              currency={currency}
                              drawerTitle={`${row.category.name} Budget`}
                            />
                          </span>
                        ) : (
                          <span className="text-positive font-bold text-[14px]">
                            + Set limit
                          </span>
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
                              <CompactAmount
                                amount={spent - limit}
                                currency={currency}
                                drawerTitle={`${row.category.name} Over Budget`}
                              />
                              <span>over budget</span>
                            </span>
                          ) : (
                            <span className={cn(
                              "text-[12px] font-normal leading-normal flex items-center gap-1",
                              isNearLimit ? "text-[#C96A1B]" : "text-[#6B6B6B]"
                            )}>
                              <span>{spentPercent}% used ·</span>
                              <CompactAmount
                                amount={limit - spent}
                                currency={currency}
                                drawerTitle={`${row.category.name} Remaining Budget`}
                              />
                              <span>left</span>
                            </span>
                          )}
                        </div>
                      )}

                      {!isLimitSet && (
                        <span className="mt-1 flex items-center gap-1 text-[12px] font-normal leading-normal text-[#6B6B6B]">
                          <CompactAmount
                            amount={spent}
                            currency={currency}
                            drawerTitle={`${row.category.name} Spending`}
                          />
                          <span>spent · no limit</span>
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
