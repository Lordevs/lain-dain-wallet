import { createFileRoute } from '@tanstack/react-router'
import AddRecurringScreen from '@/features/groups/add-recurring-screen'

export const Route = createFileRoute('/groups/$id/recurring/new')({
  component: function Component() {
    const { id } = Route.useParams()
    return (
      <AddRecurringScreen
        groupId={id}
      />
    )
  },
})
