import { createFileRoute } from '@tanstack/react-router'
import AddRecurringScreen from '@/features/groups/add-recurring-screen'

export const Route = createFileRoute('/groups/$id/recurring/$paymentId/edit')({
  component: function Component() {
    const { id, paymentId } = Route.useParams()
    return (
      <AddRecurringScreen
        groupId={id}
        editPaymentId={paymentId}
      />
    )
  },
})
