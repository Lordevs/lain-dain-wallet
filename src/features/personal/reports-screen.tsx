import { useMemo, useState } from 'react'
import { useMyExpensesReportQuery } from '@/features/expenses/api/use-my-expenses-report-query'
import ExpenseSummaryCard from './components/expense-summary-card'
import CategoryBreakdownCard from './components/category-breakdown-card'
import MonthlySpendingCard from './components/monthly-spending-card'
import MonthFilterDropdown from './components/month-filter-drawer'
import FlowHeader from '@/components/shared/flow-header'
import { Skeleton } from '@/components/ui/skeleton'
import { toExpenseSummary } from './lib/map-my-expenses-summary'
import { toCategoryBreakdownItems, toMonthlySpendingItems } from './lib/map-my-expenses-report'
import { recentPeriods, periodKey, parsePeriodKey, periodLabel, type Period } from './lib/period'

export default function ReportsScreen() {
  // undefined = the period containing today (the backend's own default).
  const [period, setPeriod] = useState<Period | undefined>(undefined)

  const reportQuery = useMyExpensesReportQuery(period?.year, period?.month)

  const periodOptions = useMemo(
    () => recentPeriods().map((p) => ({ value: periodKey(p), label: periodLabel(p) })),
    [],
  )
  const activePeriod = period ?? recentPeriods(1)[0]

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen">
      {/* Top Header */}
      <FlowHeader
        title="Reports"
        backVariant="minimal"
        rightSlot={
          <MonthFilterDropdown
            value={periodKey(activePeriod)}
            options={periodOptions}
            onChange={(key) => setPeriod(parsePeriodKey(key))}
            triggerClassName="flex items-center gap-1.5 px-4 py-1.5 bg-white rounded-full text-xs font-bold text-[#1A1A1A] border border-[#EFE7DD] shadow-[0px_2px_8px_rgba(0,0,0,0.04)] cursor-pointer outline-none select-none transition-colors hover:bg-[#F7F5F0]"
          />
        }
      />

      {/* Main Scroll Content */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {reportQuery.isLoading && (
          <>
            <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] p-6 mx-6 mt-3 flex flex-col gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-6 w-48 rounded-full" />
            </div>
            <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] p-6 mx-6 mt-4 flex items-center gap-4">
              <Skeleton className="size-[150px] rounded-full shrink-0" />
              <div className="flex-1 flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
            <Skeleton className="h-[220px] rounded-[24px] mx-4 mt-4 mb-24" />
          </>
        )}

        {reportQuery.data && (
          <>
            {/* Card 1: Spent Summary */}
            <ExpenseSummaryCard summary={toExpenseSummary(reportQuery.data)} />

            {/* Card 2: Category Breakdown */}
            <CategoryBreakdownCard
              categories={toCategoryBreakdownItems(reportQuery.data.by_category)}
              currency={reportQuery.data.currency}
            />

            {/* Card 3: Monthly Spending Bar Chart */}
            <MonthlySpendingCard
              monthlySpending={toMonthlySpendingItems(reportQuery.data.monthly)}
              activeMonthLabel={new Date(activePeriod.year, activePeriod.month - 1, 1).toLocaleDateString('en-US', {
                month: 'long',
              })}
            />
          </>
        )}
      </div>
    </div>
  )
}
