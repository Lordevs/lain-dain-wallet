import { useCallback } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useContactStore } from '@/store/use-contact-store'
import { useGroupLedger, getCategoryDetails } from '@/features/groups/hooks/use-group-ledger'
import { formatPKR } from '@/lib/currency'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import FlowHeader from '@/components/shared/flow-header'
import ExpenseList from '@/components/shared/expense-list'

/** Category drill-down view on the group detail screen: header + spent summary + filtered expense list. */
export default function GroupCategoryExpenses() {
  const { id, catId } = useParams({ from: '/groups/$id/category/$catId' })
  const navigate = useNavigate()

  const contacts = useContactStore((state) => state.contacts)
  const contact = contacts.find((c) => c.id === id)

  const { groupExpensesData } = useGroupLedger(id || '')

  // Stable identity required for ExpenseItem's memo() to actually skip
  // re-rendering rows on unrelated state changes — see expense-item.tsx.
  // Declared before the early return below to respect the Rules of Hooks.
  const onExpenseClick = useCallback((expenseId: string | number) => {
    navigate({ to: ROUTES.TRANSACTION_DETAILS, params: { id: expenseId.toString() } })
  }, [navigate])

  if (!contact) return null

  const catDetails = getCategoryDetails(catId)
  const filteredExpenses = groupExpensesData.filter((exp) => (exp.category || 'other') === catId)
  const totalSpent = filteredExpenses.reduce((sum, exp) => sum + Math.abs(exp.amount), 0)
  const formattedTotal = formatPKR(totalSpent)

  const label = catDetails.label
  const color = catDetails.color
  const Icon = catDetails.icon
  const expenses = filteredExpenses
  const onBack = () => window.history.back()

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-24 relative select-none">
      {/* Category-specific Header */}
      <FlowHeader
        title={`${label} Expenses`}
        subtitle={`${expenses.length} ${expenses.length === 1 ? 'item' : 'items'}`}
        onBack={onBack}
        backVariant="minimal"
        avatar={
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 border border-[#EFE7DD] shadow-[0px_2px_8px_rgba(0,0,0,0.02)]"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon size={20} style={{ color }} />
          </div>
        }
      />

      {/* Category Spent Summary Card */}
      <div className="px-6 mb-6 mt-4">
        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex items-center justify-between">
          <div className="flex flex-col text-left">
            <span className="text-[#6B6B6B] text-[13px] font-semibold">
              Total Category Spent
            </span>
            <span className={cn('text-3xl font-extrabold mt-2 leading-none tracking-tight text-[#1A1A1A]')}>
              {formattedTotal}
            </span>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="flex-1 overflow-y-auto px-6 pb-12 flex flex-col text-left">
        <div className="flex items-center justify-between mb-3 mt-1">
          <h3 className="text-sm font-bold text-[#1A1A1A]">
            Expenses
          </h3>
        </div>

        <ExpenseList
          expenses={expenses}
          onItemClick={onExpenseClick}
          className="border-[#EFE7DD] divide-[#EFE7DD]"
        />
      </div>
    </div>
  )
}
