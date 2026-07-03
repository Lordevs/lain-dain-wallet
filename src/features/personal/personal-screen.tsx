import { useState, useRef } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { FILTER_DATA } from './data/mock-data'
import ExpenseSummaryCard from './components/expense-summary-card'
import ViewReportsCard from './components/view-reports-card'
import ExpenseList from '@/components/shared/expense-list'
import MonthFilterDropdown from './components/month-filter-dropdown'
import FlowHeader from '@/components/shared/flow-header'
import { Drawer, DrawerContent, FULLSCREEN_DRAWER_CN } from '@/components/ui/drawer'
import AddEntryScreen from '@/features/personal/add-entry-screen'


/**
 * PersonalScreen — Orchestrator for the "My Expenses" section.
 * Renders sub-components for spent overview, view reports action cards,
 * and lists of dynamic mock personal expenses.
 */
export default function PersonalScreen() {
  const navigate = useNavigate({ from: '/personal/' })
  const { drawer } = useSearch({ from: '/personal/' })
  const [activeFilter, setActiveFilter] = useState<'this_month' | 'last_month' | 'all_time'>('this_month')
  const openedInSessionRef = useRef(false)

  const closeDrawer = () => {
    if (!drawer) return

    if (openedInSessionRef.current) {
      openedInSessionRef.current = false
      window.history.back()
    } else {
      navigate({
        search: (prev) => {
          const next = { ...prev }
          delete next.drawer
          return next
        },
        replace: true,
      })
    }
  }

  const openDrawer = (name: 'add-expense') => {
    openedInSessionRef.current = true
    navigate({
      search: (prev) => ({
        ...prev,
        drawer: name,
      }),
      replace: !!drawer,
    })
  }

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
      <div className="flex flex-col">
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
            onItemClick={() => {}}
          />
        </div>
      </div>

      {/* Absolute Bottom Action Button */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-[#FEFAF1]/90 border-t border-[#EFE7DD]/30 backdrop-blur-sm z-10">
        <Button
          type="button"
          onClick={() => openDrawer('add-expense')}
          className="w-full h-14 rounded-full bg-primary shadow-[0px_6.29px_20.13px_0px_#0B683A4D] text-white font-bold text-base cursor-pointer transition-transform active:scale-[0.99]"
        >
          Add Personal Expense
        </Button>
      </div>

      {/* Drawer Overlay for Add Personal Expense */}
      <Drawer open={drawer === 'add-expense'} onOpenChange={(open) => !open && closeDrawer()}>
        <DrawerContent className={FULLSCREEN_DRAWER_CN}>
          {drawer === 'add-expense' && (
            <AddEntryScreen onClose={closeDrawer} onSuccess={closeDrawer} />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}

