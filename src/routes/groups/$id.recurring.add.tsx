import { createFileRoute } from '@tanstack/react-router'
import AddRecurringScreen from '@/features/groups/add-recurring-screen'

interface AddRecurringSearch {
  edit?: string
}

export const Route = createFileRoute('/groups/$id/recurring/add')({
  validateSearch: (search: Record<string, unknown>): AddRecurringSearch => {
    return {
      edit: typeof search.edit === 'string' ? search.edit : undefined,
    }
  },
  component: AddRecurringScreen,
})
