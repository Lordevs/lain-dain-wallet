import { createFileRoute, redirect } from '@tanstack/react-router'
import { ROUTES } from '@/constants/routes'

// /transactions/ has no dedicated list screen yet.
// Redirect to dashboard until the transactions list feature is implemented.
export const Route = createFileRoute('/transactions/')({
  beforeLoad: () => {
    throw redirect({ to: ROUTES.DASHBOARD, replace: true })
  },
  component: () => null,
})
