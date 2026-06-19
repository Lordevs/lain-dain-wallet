import { createFileRoute, redirect } from '@tanstack/react-router'

// /transactions/ has no dedicated list screen yet.
// Redirect to dashboard until the transactions list feature is implemented.
export const Route = createFileRoute('/transactions/')({
  beforeLoad: () => {
    throw redirect({ to: '/', replace: true })
  },
  component: () => null,
})
