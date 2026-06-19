import { createFileRoute } from '@tanstack/react-router'
import GroupRecurringScreen from '@/features/groups/recurring-payments-screen'

export const Route = createFileRoute('/groups/$id/recurring/')({
  component: GroupRecurringScreen,
})
