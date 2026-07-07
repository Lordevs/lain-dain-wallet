import { createFileRoute } from '@tanstack/react-router'
import GroupCategoryExpenses from '@/features/groups/components/group-category-expenses'

export const Route = createFileRoute('/groups/$id/category/$catId')({
  component: GroupCategoryExpenses,
})
