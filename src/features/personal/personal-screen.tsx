import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { MoreVertical, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { useMyExpensesSummaryQuery } from '@/features/expenses/api/use-my-expenses-summary-query'
import { useMyExpensesListQuery } from '@/features/expenses/api/use-my-expenses-list-query'
import ExpenseSummaryCard from './components/expense-summary-card'
import ViewReportsCard from './components/view-reports-card'
import ExpenseList from '@/components/shared/expense-list'
import ExpenseListSkeleton from '@/components/shared/expense-list-skeleton'
import MonthFilterDropdown from './components/month-filter-drawer'
import FlowHeader from '@/components/shared/flow-header'
import InfiniteScrollSentinel from '@/components/shared/infinite-scroll-sentinel'
import { toExpenseSummary } from './lib/map-my-expenses-summary'
import { toExpenseListItem } from './lib/map-my-expense-item'
import { recentPeriods, periodKey, parsePeriodKey, periodLabel, type Period } from './lib/period'
import { useMyExpensesReportQuery } from '@/features/expenses/api/use-my-expenses-report-query'
import { toCategoryBreakdownItems } from './lib/map-my-expenses-report'
import { iconForCategory } from '@/features/expenses/lib/category-icons'

/**
 * PersonalScreen — the "My Expenses" home: this period's spend, a link
 * into the Reports screen, and the combined feed (personal expenses plus
 * any friendship/group expense the caller has a split in) for whichever
 * period is selected.
 */
export default function PersonalScreen() {
  const navigate = useNavigate()

  // undefined = the period containing today (the backend's own default) —
  // only set once the user actually picks a different one.
  const [period, setPeriod] = useState<Period | undefined>(undefined)
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined)

  const summaryQuery = useMyExpensesSummaryQuery(period?.year, period?.month)
  const listQuery = useMyExpensesListQuery(period?.year, period?.month, categoryId)
  const reportQuery = useMyExpensesReportQuery(period?.year, period?.month)
  const categories = useMemo(
    () => toCategoryBreakdownItems(reportQuery.data?.by_category ?? []),
    [reportQuery.data],
  )

  const periodOptions = useMemo(
    () => recentPeriods().map((p) => ({ value: periodKey(p), label: periodLabel(p) })),
    [],
  )
  const activePeriod = period ?? recentPeriods(1)[0]

  const items = useMemo(
    () => (listQuery.data ?? []).map((item) => toExpenseListItem(item)),
    [listQuery.data],
  )

  // Stable identity required for ExpenseItem's memo() to actually skip
  // re-rendering rows on unrelated state changes — see expense-item.tsx.
  const handleItemClick = useCallback((id: string | number) => {
    navigate({ to: ROUTES.TRANSACTION_DETAILS, params: { id: String(id) } })
  }, [navigate])

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#FEFAF1]">
      {/* Top Header */}
      <FlowHeader
        title="My Expenses"
        backVariant='minimal'
        rightSlot={
          <button
            onClick={() => navigate({ to: ROUTES.PERSONAL_SETTINGS })}
            className="text-[#6B6B6B] cursor-pointer border-0 bg-transparent flex items-center justify-center p-2 hover:opacity-80 transition-opacity"
          >
            <MoreVertical size={20} />
          </button>
        }
      />

      {/* Fixed summary and controls */}
      <div className="flex shrink-0 flex-col">
        {/* Card 1: Spent Stat Card */}
        {summaryQuery.data ? (
          <ExpenseSummaryCard summary={toExpenseSummary(summaryQuery.data)} />
        ) : summaryQuery.isLoading ? (
          <ExpenseSummaryCard.Skeleton />
        ) : (
          // Offline with nothing cached — this query has no offline
          // fallback (it's a server-computed aggregate), so without this
          // branch the skeleton above would show forever instead of
          // resolving into anything.
          <div className="mx-6 mt-3 flex items-center gap-3 rounded-[20px] border-[0.8px] border-[#EBEBEB] bg-white p-4 shadow-[0px_2px_5px_0px_#0000000D]">
            <WifiOff size={18} className="shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              You're offline — this month's summary isn't available until you're back online.
            </p>
          </div>
        )}

        {/* Card 2: View Reports */}
        <ViewReportsCard onClick={() => navigate({ to: ROUTES.PERSONAL_REPORTS })} />

        {/* Section Header: Period Filter */}
        <div className="flex items-center justify-between px-6 mt-6 mb-3">
          <span className="text-sm font-medium text-[#6B6B6B]">{periodLabel(activePeriod)}</span>
          <MonthFilterDropdown
            value={periodKey(activePeriod)}
            options={periodOptions}
            onChange={(key) => setPeriod(parsePeriodKey(key))}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none px-6 pb-1">
          <button type="button" onClick={() => setCategoryId(undefined)} className={`shrink-0 rounded-full border-[1.5px] px-3.5 py-2 text-[13px] font-semibold ${!categoryId ? 'border-[#0B683A4D] bg-[#E4F2EB] text-primary' : 'border-[#E8E5DE] bg-white text-[#1A1A1A]'}`}>All</button>
          {categories.map((category) => {
            const Icon = iconForCategory(reportQuery.data?.by_category.find((item) => item.category.id === category.id)?.category.icon ?? 'other')
            return <button key={category.id} type="button" onClick={() => setCategoryId(category.id)} className={`flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-2 text-[13px] font-semibold ${categoryId === category.id ? 'border-[#0B683A4D] bg-[#E4F2EB] text-primary' : 'border-[#E8E5DE] bg-white text-[#1A1A1A]'}`}><Icon size={14} style={{ color: category.color }} strokeWidth={2} />{category.label}</button>
          })}
        </div>

      </div>

      {/* Only this region scrolls when expense rows exist. */}
      <div className={items.length === 0 && !listQuery.isLoading
        ? 'flex min-h-0 flex-1 items-center justify-center overflow-hidden px-6'
        : 'min-h-0 flex-1 overflow-y-auto px-6 pb-16'
      }>
        {listQuery.isLoading ? (
          <ExpenseListSkeleton />
        ) : items.length === 0 ? (
          <p className="pb-4 text-center text-[clamp(13px,3.6vw,15px)] text-muted-foreground">
            No expenses this period.
          </p>
        ) : (
          <>
            <ExpenseList expenses={items} onItemClick={handleItemClick} />
            <InfiniteScrollSentinel
              onLoadMore={listQuery.fetchNextPage}
              hasMore={listQuery.hasNextPage}
              isLoading={listQuery.isFetchingNextPage}
            />
          </>
        )}
      </div>

      <Button
        type="button"
        onClick={() => navigate({ to: ROUTES.PERSONAL_ADD_EXPENSE })}
        className="absolute bottom-0 left-2 right-2 z-40 h-12 rounded-full bg-primary text-[clamp(14px,4vw,16px)] font-bold text-white shadow-lg transition-transform active:scale-[0.99] cursor-pointer"
        aria-label="Add expense"
      >
        Add Expense
      </Button>
    </div>
  )
}
