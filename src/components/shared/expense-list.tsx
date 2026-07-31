import ExpenseItem, { type ExpenseCategory } from './expense-item'
import { cn } from '@/lib/utils'

export interface ExpenseListData {
  id: string | number
  name: string
  subtitle?: React.ReactNode
  amount: number
  currency?: string
  category?: ExpenseCategory
  categoryIcon?: string
  categoryColor?: string
  rightSubtitle?: string
  showChevron?: boolean
  className?: string
  leftSlot?: React.ReactNode
  amountColor?: 'green' | 'orange' | 'black' | 'default'
  /** Distinguishes a real Expense row from a Settlement row in a merged
   * feed (contact/group transaction history) — callers use this to route
   * to the right detail screen, since the two are different backend
   * models with different detail endpoints. Defaults to 'expense'. */
  kind?: 'expense' | 'settlement'
}

/** A transaction record adapted for date-grouped list rendering (contact/group detail screens). */
export interface TransactionListItem extends ExpenseListData {
  id: string
  name: string
  subtitle: React.ReactNode
  amount: number
  category: ExpenseCategory
  rightSubtitle: string
  showChevron?: boolean
  className?: string
}

interface ExpenseListProps {
  expenses: ExpenseListData[]
  onItemClick?: (id: string | number, kind?: 'expense' | 'settlement') => void
  amountColor?: 'green' | 'orange' | 'black' | 'default'
  className?: string
}

/**
 * ExpenseList — A premium, reusable container that wraps a list of ExpenseItem components.
 * Standardizes rounded borders, border separators, and visual box shadows.
 */
export default function ExpenseList({
  expenses,
  onItemClick,
  amountColor = 'default',
  className,
}: ExpenseListProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-[24px] border-[0.8px] border-divider overflow-hidden shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-divider',
        className
      )}
    >
      {expenses.map((expense) => (
        <ExpenseItem
          key={expense.id}
          name={expense.name}
          subtitle={expense.subtitle}
          amount={expense.amount}
          currency={expense.currency}
          category={expense.category}
          categoryIcon={expense.categoryIcon}
          categoryColor={expense.categoryColor}
          amountColor={expense.amountColor ?? amountColor}
          rightSubtitle={expense.rightSubtitle}
          showChevron={expense.showChevron ?? true}
          className={expense.className}
          leftSlot={expense.leftSlot}
          onClick={onItemClick ? () => onItemClick(expense.id, expense.kind) : undefined}
        />
      ))}
    </div>
  )
}
