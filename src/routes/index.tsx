import { createFileRoute } from '@tanstack/react-router'
import App from '@/App'

export interface DashboardSearch {
  drawer?: 'breakdown'
  contactId?: string
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => {
    return {
      drawer: search.drawer === 'breakdown' ? 'breakdown' : undefined,
      contactId: typeof search.contactId === 'string' ? search.contactId : undefined,
    }
  },
  component: App,
})


