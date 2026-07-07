import { createFileRoute, useNavigate } from '@tanstack/react-router'
import GroupRecurringScreen from '@/features/groups/recurring-payments-screen'

export const Route = createFileRoute('/groups/$id/recurring/')({
  component: function Component() {
    const { id } = Route.useParams()
    const navigate = useNavigate()
    return (
      <GroupRecurringScreen
        groupId={id}
        onClose={() => navigate({ to: '/groups/$id/settings', params: { id } })}
      />
    )
  },
})


