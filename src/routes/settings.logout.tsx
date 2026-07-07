import { createFileRoute } from '@tanstack/react-router'
import LogoutPanel from '@/features/settings/components/logout-panel'

export const Route = createFileRoute('/settings/logout')({
  component: LogoutPanel,
})
