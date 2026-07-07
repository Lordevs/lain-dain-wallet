import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { FILTER_DATA } from './data/mock-data'
import ExpenseSummaryCard from './components/expense-summary-card'
import ViewReportsCard from './components/view-reports-card'
import ExpenseList from '@/components/shared/expense-list'
import MonthFilterDropdown from './components/month-filter-drawer'
import FlowHeader from '@/components/shared/flow-header'



/**
 * PersonalScreen — Orchestrator for the "My Expenses" section.
 * Renders sub-components for spent overview, view reports action cards,
 * and lists of dynamic mock personal expenses.
 */
export default function PersonalScreen() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<'this_month' | 'last_month' | 'all_time'>('this_month')

  const currentData = FILTER_DATA[activeFilter]

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
        <ExpenseSummaryCard summary={currentData.summary} />

        {/* Card 2: View Reports */}
        <ViewReportsCard onClick={() => navigate({ to: ROUTES.PERSONAL_REPORTS })} />

        {/* Section Header: Monthly Filter */}
        <div className="flex items-center justify-between px-6 mt-6 mb-3">
          <span className="text-sm font-medium text-[#6B6B6B]">
            {activeFilter === 'all_time' ? 'All Time' : currentData.label}
          </span>
          <MonthFilterDropdown
            value={activeFilter}
            options={[
              { value: 'this_month', label: 'This month' },
              { value: 'last_month', label: 'Last month' },
              { value: 'all_time', label: 'All time' },
            ]}
            onChange={setActiveFilter}
          />
        </div>

        {/* Expenses List */}
        <div className="px-6">
          <ExpenseList
            expenses={currentData.expenses}
            amountColor="green"
            onItemClick={(id) => navigate({ to: ROUTES.TRANSACTION_DETAILS, params: { id: String(id) } })}
          />
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

