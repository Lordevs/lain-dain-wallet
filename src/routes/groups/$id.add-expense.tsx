import { createFileRoute } from '@tanstack/react-router'
import AddGroupExpenseScreen from '@/features/groups/add-group-expense-screen'

export const Route = createFileRoute('/groups/$id/add-expense')({
  component: AddGroupExpenseScreen,
})
