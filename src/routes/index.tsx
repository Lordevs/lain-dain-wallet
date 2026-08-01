import { createFileRoute } from '@tanstack/react-router'
import App from '@/App'

type DashboardSearch = { search?: string }

// A single optional string field doesn't need zod's ~56KB — this mirrors
// exactly what `z.object({ search: z.string().optional() })` validated.
function validateDashboardSearch(search: Record<string, unknown>): DashboardSearch {
  return typeof search.search === 'string' ? { search: search.search } : {}
}

export const Route = createFileRoute('/')({
  validateSearch: validateDashboardSearch,
  component: App,
})
