import ExpenseItem, { type ExpenseCategory } from './expense-item'
import { cn } from '@/lib/utils'

export interface ExpenseListData {
  id: string | number
  name: string
  subtitle: string
  amount: number
  currency?: string
  category?: ExpenseCategory
}

interface ExpenseListProps {
  expenses: ExpenseListData[]
  onItemClick?: (id: string | number) => void
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
        'bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] overflow-hidden shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EBEBEB]',
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
          amountColor={amountColor}
          onClick={onItemClick ? () => onItemClick(expense.id) : undefined}
        />
      ))}
    </div>
  )
}
