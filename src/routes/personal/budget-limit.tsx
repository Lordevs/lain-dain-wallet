import { createFileRoute } from '@tanstack/react-router'
import BudgetLimitScreen from '@/features/personal/budget-limit-screen'

export const Route = createFileRoute('/personal/budget-limit')({
  component: BudgetLimitScreen,
})
