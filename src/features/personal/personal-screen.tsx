import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/store/use-auth-store'
import { useMyExpensesSummaryQuery } from '@/features/expenses/api/use-my-expenses-summary-query'
import { useMyExpensesListQuery } from '@/features/expenses/api/use-my-expenses-list-query'
import ExpenseSummaryCard from './components/expense-summary-card'
import ViewReportsCard from './components/view-reports-card'
import ExpenseList from '@/components/shared/expense-list'
import ExpenseListSkeleton from '@/components/shared/expense-list-skeleton'
import MonthFilterDropdown from './components/month-filter-drawer'
import FlowHeader from '@/components/shared/flow-header'
import { Skeleton } from '@/components/ui/skeleton'
import { toExpenseSummary } from './lib/map-my-expenses-summary'
import { toExpenseListItem } from './lib/map-my-expense-item'
import { recentPeriods, periodKey, parsePeriodKey, periodLabel, type Period } from './lib/period'

/**
 * PersonalScreen — the "My Expenses" home: this period's spend, a link
 * into the Reports screen, and the combined feed (personal expenses plus
 * any friendship/group expense the caller has a split in) for whichever
 * period is selected.
 */
export default function PersonalScreen() {
  const navigate = useNavigate()
  const myId = useAuthStore((s) => s.userProfile?.id)

  // undefined = the period containing today (the backend's own default) —
  // only set once the user actually picks a different one.
  const [period, setPeriod] = useState<Period | undefined>(undefined)

  const summaryQuery = useMyExpensesSummaryQuery(period?.year, period?.month)
  const listQuery = useMyExpensesListQuery(period?.year, period?.month)

  const periodOptions = useMemo(
    () => recentPeriods().map((p) => ({ value: periodKey(p), label: periodLabel(p) })),
    [],
  )
  const activePeriod = period ?? recentPeriods(1)[0]

  const items = useMemo(
    () => (listQuery.data ?? []).map((item) => toExpenseListItem(item, myId)),
    [listQuery.data, myId],
  )

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen">
      {/* Top Header */}
      <FlowHeader
        title="My Expenses"
        rightSlot={
          <button
            onClick={() => navigate({ to: ROUTES.PERSONAL_SETTINGS })}
            className="text-[#6B6B6B] cursor-pointer border-0 bg-transparent flex items-center justify-center p-2 hover:opacity-80 transition-opacity"
          >
            <MoreVertical size={20} />
          </button>
        }
      />

      {/* Main Content Scroll Container */}
      <div className="flex flex-col pb-44">
        {/* Card 1: Spent Stat Card */}
        {summaryQuery.data ? (
          <ExpenseSummaryCard summary={toExpenseSummary(summaryQuery.data)} />
        ) : (
          <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] p-6 mx-6 mt-3 flex flex-col gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-6 w-48 rounded-full" />
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

        {/* Expenses List */}
        <div className="px-6">
          {listQuery.isLoading ? (
            <ExpenseListSkeleton />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No expenses this period.</p>
          ) : (
            <ExpenseList
              expenses={items}
              onItemClick={(id) => navigate({ to: ROUTES.TRANSACTION_DETAILS, params: { id: String(id) } })}
            />
          )}
        </div>
      </div>

      {/* Absolute Bottom Action Button */}
      <div className="fixed bottom-3 left-3 right-3 z-10">
        <Button
          type="button"
          onClick={() => navigate({ to: ROUTES.PERSONAL_ADD_EXPENSE })}
          className="w-full h-14 rounded-full bg-primary text-white font-bold text-base cursor-pointer transition-transform active:scale-[0.99]"
        >
          Add Personal Expense
        </Button>
      </div>
    </div>
  )
}
