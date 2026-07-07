import { createFileRoute } from '@tanstack/react-router'
import EditProfilePanel from '@/features/settings/components/edit-profile-panel'

export const Route = createFileRoute('/settings/profile')({
  component: EditProfilePanel,
})
