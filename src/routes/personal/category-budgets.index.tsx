import { createFileRoute } from '@tanstack/react-router'
import CategoryBudgetsScreen from '@/features/personal/category-budgets-screen'

export const Route = createFileRoute('/personal/category-budgets/')({
  component: CategoryBudgetsScreen,
})
