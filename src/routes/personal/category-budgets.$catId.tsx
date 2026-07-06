import { createFileRoute } from '@tanstack/react-router'
import SetCategoryLimitScreen from '@/features/personal/set-category-limit-screen'

export const Route = createFileRoute('/personal/category-budgets/$catId')({
  component: SetCategoryLimitScreen,
})
