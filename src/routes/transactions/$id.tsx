import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/transactions/$id')({
  component: () => <Outlet />,
})
