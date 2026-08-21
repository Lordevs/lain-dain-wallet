import { createFileRoute } from '@tanstack/react-router'
import GroupRecurringScreen from '@/features/groups/recurring-payments-screen'

export const Route = createFileRoute('/groups/$id/recurring/')({
  component: function Component() {
    const { id } = Route.useParams()
    return (
      <GroupRecurringScreen
        groupId={id}
        // Pop the history entry Settings pushed to get here — a forward
        // navigate({ to: GROUP_SETTINGS }) would instead push a NEW entry
        // on top, so each screen's back button kept pushing the other
        // back onto the stack forever instead of ever popping out.
        onClose={() => window.history.back()}
      />
    )
  },
})


