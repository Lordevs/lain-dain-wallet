import { useState } from 'react'
import { useSearch } from '@tanstack/react-router'
import FlowHeader from '@/components/shared/flow-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyExpensesReportQuery } from '@/features/expenses/api/use-my-expenses-report-query'
import { toCategoryBreakdownItems } from './lib/map-my-expenses-report'
import { periodLabel } from './lib/period'
import CategoryPieChart from './components/category-pie-chart'
import CategoryLegendList from './components/category-legend-list'

/**
 * CategoryBreakdownScreen — the full "By Category" detail view opened
 * from the Reports screen's compact card: pie chart at the top, the
 * complete per-category legend below it. Re-fetches the same report
 * query (TanStack Query dedupes against Reports screen's own fetch of
 * the same year/month) rather than threading fetched data through
 * navigation state.
 */
export default function CategoryBreakdownScreen() {
  const { year, month } = useSearch({ from: '/personal/reports/category-breakdown' })
  const reportQuery = useMyExpensesReportQuery(year, month)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const title = year && month ? periodLabel({ year, month }) : 'This period'

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none overflow-hidden text-left">
      <FlowHeader title="By Category" subtitle={title} backVariant="circle" />

      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-12 flex flex-col gap-6 mt-2">
        {reportQuery.isLoading && (
          <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] p-6 flex flex-col items-center gap-6">
            <Skeleton className="size-45 rounded-full" />
            <div className="w-full flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>
        )}

        {reportQuery.data && (() => {
          const categories = toCategoryBreakdownItems(reportQuery.data.by_category)
          if (categories.length === 0) {
            return (
              <p className="text-sm text-muted-foreground text-center py-8">
                No expenses this period.
              </p>
            )
          }
          return (
            <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] shadow-[0px_2px_10px_0px_#0000000D] p-6 flex flex-col gap-6">
              <div className="flex justify-center">
                <CategoryPieChart
                  categories={categories}
                  hoveredIndex={hoveredIndex}
                  onHoverIndex={setHoveredIndex}
                  className="relative w-full aspect-square flex items-center justify-center max-w-[260px]"
                />
              </div>
              <CategoryLegendList
                categories={categories}
                currency={reportQuery.data.currency}
                hoveredIndex={hoveredIndex}
                onHoverIndex={setHoveredIndex}
                className="flex flex-col gap-2"
              />
            </div>
          )
        })()}
      </div>
    </div>
  )
}
