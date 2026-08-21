import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/personal/reports')({
  component: () => <Outlet />,
})
