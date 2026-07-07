import { createFileRoute } from '@tanstack/react-router'
import DeleteAccountPanel from '@/features/settings/components/delete-account-panel'

export const Route = createFileRoute('/settings/delete-account')({
  component: DeleteAccountPanel,
})
