import { createFileRoute, redirect } from '@tanstack/react-router'
import { ROUTES } from '@/constants/routes'

// /contacts/ has no dedicated list screen yet.
// Redirect to dashboard until the contacts list feature is implemented.
export const Route = createFileRoute('/contacts/')({
  beforeLoad: () => {
    throw redirect({ to: ROUTES.DASHBOARD, replace: true })
  },
  component: () => null,
})
