import { createFileRoute, useNavigate } from '@tanstack/react-router'
import GroupRecurringScreen from '@/features/groups/recurring-payments-screen'

export interface RecurringSearch {
  drawer?: 'add-recurring'
  subDrawer?: 'add-recurring'
  edit?: string
}

export const Route = createFileRoute('/groups/$id/recurring/')({
  validateSearch: (search: Record<string, unknown>): RecurringSearch => {
    return {
      drawer: search.drawer === 'add-recurring' ? search.drawer : undefined,
      subDrawer: search.subDrawer === 'add-recurring' ? search.subDrawer : undefined,
      edit: typeof search.edit === 'string' ? search.edit : undefined,
    }
  },
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


