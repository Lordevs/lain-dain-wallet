import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/groups/$id/settings')({
  component: () => <Outlet />,
})
