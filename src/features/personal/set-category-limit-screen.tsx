import { createElement, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { toast } from 'sonner'
import { usePersonalExpenseSettingsQuery } from '@/features/expenses/api/use-personal-expense-settings-query'
import { useCategoryBudgetsQuery } from '@/features/expenses/api/use-category-budgets-query'
import { useSetCategoryBudgetMutation } from '@/features/expenses/api/use-set-category-budget-mutation'
import { useRemoveCategoryBudgetMutation } from '@/features/expenses/api/use-remove-category-budget-mutation'
import { iconForCategory } from '@/features/expenses/lib/category-icons'
import { formatCurrency } from '@/lib/currency'
import FlowHeader from '@/components/shared/flow-header'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { components } from '@/lib/api/schema'

type CategoryBudgetItem = components['schemas']['CategoryBudgetItem']

function getOrdinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default function SetCategoryLimitScreen() {
  const { catId } = useParams({ from: '/personal/category-budgets/$catId' })

  const settingsQuery = usePersonalExpenseSettingsQuery()
  const categoryBudgetsQuery = useCategoryBudgetsQuery()

  if (categoryBudgetsQuery.isLoading || settingsQuery.isLoading) {
    return (
      <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen px-6 pt-5 gap-5">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-64 rounded-[24px]" />
      </div>
    )
  }

  const row = categoryBudgetsQuery.data?.categories.find((r) => r.category.id === catId)

  if (!row || !settingsQuery.data) {
    return (
      <div className="flex items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
        <div className="text-center">
          <p className="text-lg font-bold text-[#1A1A1A]">Category not found</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-positive text-white rounded-full font-bold border-0 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  // Mounted only once real data exists, so its own useState lazy
  // initializer picks up the real limit on first render.
  return (
    <SetCategoryLimitForm
      catId={catId}
      row={row}
      currency={categoryBudgetsQuery.data!.currency}
      periodStartDay={settingsQuery.data.period_start_day}
    />
  )
}

function SetCategoryLimitForm({
  catId,
  row,
  currency,
  periodStartDay,
}: {
  catId: string
  row: CategoryBudgetItem
  currency: string
  periodStartDay: number
}) {
  const setCategoryBudget = useSetCategoryBudgetMutation()
  const removeCategoryBudget = useRemoveCategoryBudgetMutation()

  const [limitValue, setLimitValue] = useState(row.limit_amount ? Number(row.limit_amount) : 5000)

  const handleSave = () => {
    setCategoryBudget.mutate(
      { categoryId: catId, limitAmount: limitValue.toFixed(2) },
      { onSuccess: () => window.history.back(), onError: (err) => toast.error(err.message) },
    )
  }

  const handleRemove = () => {
    removeCategoryBudget.mutate(catId, {
      onSuccess: () => window.history.back(),
      onError: (err) => toast.error(err.message),
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '')
    setLimitValue(rawVal ? Number(rawVal) : 0)
  }

  const presets = [2000, 3000, 5000, 8000, 10000]

  const spent = Number(row.spent)
  const spentPercent = limitValue > 0 ? Math.round((spent / limitValue) * 100) : 0
  const isOverBudget = limitValue > 0 && spent > limitValue
  const isNearLimit = limitValue > 0 && !isOverBudget && spentPercent >= 80
  const hasExistingLimit = row.limit_amount !== null

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none overflow-hidden text-[#1A1A1A]">
      {/* Top Header */}
      <FlowHeader
        title="Set Category Limit"
        backVariant="circle"
        rightSlot={
          <button
            onClick={handleSave}
            disabled={setCategoryBudget.isPending}
            className="text-positive font-bold text-base bg-transparent border-0 cursor-pointer outline-none hover:opacity-85 disabled:opacity-50"
          >
            Save
          </button>
        }
      />

      {/* Main Scroll Container */}
      <div className="flex-1 overflow-y-auto px-6 pb-28 flex flex-col gap-5 mt-2">
        {/* Category Details Card */}
        <div className="bg-white border border-[#EBEBEB] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-5 flex items-center gap-4 text-left">
          <div
            className="w-14 h-14 rounded-[18px] flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${row.category.color}1A`, color: row.category.color }}
          >
            {createElement(iconForCategory(row.category.icon), { size: 24, strokeWidth: 2.5 })}
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <h3 className="text-base font-extrabold text-[#1A1A1A] leading-tight">
              {row.category.name}
            </h3>
            <span className="text-[12px] font-normal text-[#6B6B6B] mt-1.5 leading-normal">
              {formatCurrency(spent, currency)} spent this month
            </span>
          </div>
        </div>

        {/* Monthly Limit Section */}
        <div className="flex flex-col text-left">
          <h4 className="text-[11px] font-semibold text-[#6B6B6B] tracking-[0.8px] mb-1 px-1 uppercase">
            Monthly limit
          </h4>
          <div className="bg-white border-[1.5px] border-[#EBEBEB] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
            {/* Amount input block matching AddExpenseBase style */}
            <div className="flex border-b-[1.5px] border-[#EBEBEB] h-18 items-stretch">
              <div className="flex items-center justify-center bg-[#FFF9E6] px-5 border-r-[1.5px] border-[#EBEBEB] select-none shrink-0">
                <span className="text-base font-extrabold text-[#C96A1B] leading-none">
                  Rs.
                </span>
              </div>
              <div className="flex-1 flex items-center px-4 relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={limitValue === 0 ? '' : limitValue.toLocaleString('en-US')}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border-0 outline-none text-[36px]! font-black text-foreground placeholder:text-divider font-sans leading-none py-1"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Slider & Presets area */}
            <div className="p-5 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[12px] font-bold text-[#9A9590]">
                  <span>Rs. 1,000</span>
                  <span>Rs. 50,000</span>
                </div>
                <Slider
                  min={1000}
                  max={50000}
                  step={500}
                  value={[Math.max(1000, Math.min(50000, limitValue))]}
                  onValueChange={(val) => setLimitValue(val[0])}
                  className="py-2"
                />
              </div>

              {/* Presets */}
              <div className="flex flex-wrap items-center gap-2">
                {presets.map((preset) => {
                  const isSelected = limitValue === preset
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setLimitValue(preset)}
                      className={cn(
                        "h-10 px-4 flex items-center justify-center font-bold text-xs rounded-[10px] transition-all border outline-none cursor-pointer",
                        isSelected
                          ? "bg-[#E4F2EB] border-positive text-positive border-[1.5px]"
                          : "bg-[#F8F6F2] border-[#EBEBEB] text-[#6B6B6B] hover:bg-muted/10"
                      )}
                    >
                      Rs. {preset.toLocaleString('en-US')}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* What This Means Section */}
        <div className="flex flex-col text-left">
          <h4 className="text-[11px] font-semibold text-[#6B6B6B] tracking-[0.8px] mb-1 px-1 uppercase">
            What this means
          </h4>
          <div className="bg-white border-[1.5px] border-[#EBEBEB] rounded-[24px] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y-[1.5px] divide-[#EBEBEB] overflow-hidden">

            {/* Current Usage row */}
            <div className="p-5 flex flex-col text-left">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold text-[#1A1A1A]">
                  Current usage
                </span>
                <span className={cn(
                  "text-[15px] font-bold",
                  isOverBudget ? "text-[#C0392B]" : isNearLimit ? "text-[#C96A1B]" : "text-positive"
                )}>
                  {formatCurrency(spent, currency)} / {formatCurrency(limitValue, currency)}
                </span>
              </div>

              {/* Progress Bar */}
              <Progress
                value={spentPercent}
                className="w-full h-1.5 bg-[#F2EFEA] mt-3"
                indicatorClassName={cn(
                  isOverBudget ? "bg-[#C0392B]" : isNearLimit ? "bg-[#C96A1B]" : "bg-positive"
                )}
              />

              <span className={cn(
                "text-[12px] font-normal mt-2 leading-normal",
                isOverBudget ? "text-[#C0392B]" : isNearLimit ? "text-[#C96A1B]" : "text-[#6B6B6B]"
              )}>
                {isOverBudget
                  ? `${formatCurrency(spent - limitValue, currency)} over budget`
                  : `${spentPercent}% used · ${formatCurrency(limitValue - spent, currency)} remaining this month`}
              </span>
            </div>

            {/* Resets On row */}
            <div className="p-5 flex items-center justify-between">
              <div className="flex flex-col text-left pr-4">
                <span className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">
                  Resets on
                </span>
                <span className="text-[12px] font-normal text-[#6B6B6B] mt-1 leading-normal">
                  Based on your default period
                </span>
              </div>
              <span className="text-[15px] font-bold text-[#1A1A1A] shrink-0">
                {getOrdinal(periodStartDay)} of month
              </span>
            </div>
          </div>
        </div>

        {/* Remove Limit Button */}
        {hasExistingLimit && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={removeCategoryBudget.isPending}
            className="w-full h-14 bg-white border-[1.5px] border-[#C0392B40] text-[#C0392B] rounded-[20px] font-bold text-base cursor-pointer shadow-[0px_2px_8px_rgba(0,0,0,0.01)] hover:bg-[#FFF3F3]/50 transition-colors outline-none disabled:opacity-50"
          >
            Remove limit for {row.category.name}
          </button>
        )}
      </div>

      {/* Sticky Bottom Save Button */}
      <div className="fixed bottom-3 left-3 right-3 z-10">
        <Button
          onClick={handleSave}
          disabled={setCategoryBudget.isPending}
          className="w-full max-w-md h-14 rounded-full bg-positive hover:bg-positive/95 text-white font-bold text-base"
        >
          Save
        </Button>
      </div>
    </div>
  )
}
