import { createFileRoute } from '@tanstack/react-router'
import EditGroupNamePanel from '@/features/groups/components/edit-group-name-panel'

export const Route = createFileRoute('/groups/$id/settings/name')({
  component: EditGroupNamePanel,
})
