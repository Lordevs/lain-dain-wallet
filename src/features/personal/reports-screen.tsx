import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ROUTES } from '@/constants/routes'
import { REPORTS_MOCK_DATA } from './data/mock-data'
import ExpenseSummaryCard from './components/expense-summary-card'
import CategoryBreakdownCard from './components/category-breakdown-card'
import MonthlySpendingCard from './components/monthly-spending-card'
import MonthFilterDropdown from './components/month-filter-dropdown'
import FlowHeader from '@/components/shared/flow-header'

type ReportPeriodKey = 'april_2026' | 'march_2026' | 'february_2026'

export default function ReportsScreen() {
  const navigate = useNavigate()

  // Global header filter state (select month/year)
  const [selectedReportPeriod, setSelectedReportPeriod] = useState<ReportPeriodKey>('april_2026')

  // Local category card period filter state
  const [categoryPeriod, setCategoryPeriod] = useState<'this_month' | 'last_month' | 'all_time'>('this_month')

  // Fetch data matching global report period
  const activeReport = REPORTS_MOCK_DATA[selectedReportPeriod]

  // Map month labels for chart highlights
  const periodLabelMap: Record<ReportPeriodKey, string> = {
    april_2026: 'April',
    march_2026: 'March',
    february_2026: 'February',
  }

  // Categories resolver based on category filter
  const getFilteredCategories = () => {
    if (categoryPeriod === 'this_month') {
      return activeReport.categories
    }
    if (categoryPeriod === 'last_month') {
      // Show March categories if April is selected, or February if March, etc.
      const previousKeyMap: Record<ReportPeriodKey, ReportPeriodKey> = {
        april_2026: 'march_2026',
        march_2026: 'february_2026',
        february_2026: 'april_2026', // Loop back for mock purposes
      }
      const previousKey = previousKeyMap[selectedReportPeriod]
      return REPORTS_MOCK_DATA[previousKey].categories
    }
    // 'all_time' categories
    return [
      { id: '1', label: 'Food', amount: 66124, percentage: 50, color: '#01592B' },
      { id: '2', label: 'Bills & Utilities', amount: 28786, percentage: 22, color: '#74A88E' },
      { id: '3', label: 'Fuel', amount: 19658, percentage: 15, color: '#A9CCB8' },
      { id: '4', label: 'Pharmacy', amount: 15482, percentage: 13, color: '#FDB105' },
    ]
  }

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen">
      {/* Top Header */}
      <FlowHeader
        title="Reports"
        onBack={() => navigate({ to: ROUTES.PERSONAL })}
        backVariant="minimal"
        rightSlot={
          <MonthFilterDropdown<ReportPeriodKey>
            value={selectedReportPeriod}
            options={[
              { value: 'april_2026', label: 'April 2026' },
              { value: 'march_2026', label: 'March 2026' },
              { value: 'february_2026', label: 'February 2026' },
            ]}
            onChange={(val) => {
              setSelectedReportPeriod(val)
              // Reset local category card filter to 'this_month' when global month changes
              setCategoryPeriod('this_month')
            }}
            triggerClassName="flex items-center gap-1.5 px-4 py-1.5 bg-white rounded-full text-xs font-bold text-[#1A1A1A] border border-[#EFE7DD] shadow-[0px_2px_8px_rgba(0,0,0,0.04)] cursor-pointer outline-none select-none transition-colors hover:bg-[#F7F5F0]"
          />
        }
      />

      {/* Main Scroll Content */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Card 1: Spent Summary */}
        <ExpenseSummaryCard summary={activeReport.summary} />

        {/* Card 2: Category Breakdown */}
        <CategoryBreakdownCard
          categories={getFilteredCategories()}
          currency={activeReport.summary.currency}
          activePeriod={categoryPeriod}
          onPeriodChange={setCategoryPeriod}
        />

        {/* Card 3: Monthly Spending Bar Chart */}
        <MonthlySpendingCard
          monthlySpending={activeReport.monthlySpending}
          activeMonthLabel={periodLabelMap[selectedReportPeriod]}
        />
      </div>
    </div>
  )
}
