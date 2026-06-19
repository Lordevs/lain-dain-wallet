import { createFileRoute, redirect } from '@tanstack/react-router'

// /contacts/ has no dedicated list screen yet.
// Redirect to dashboard until the contacts list feature is implemented.
export const Route = createFileRoute('/contacts/')({
  beforeLoad: () => {
    throw redirect({ to: '/', replace: true })
  },
  component: () => null,
})
