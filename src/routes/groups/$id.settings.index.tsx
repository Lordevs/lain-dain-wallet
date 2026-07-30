import { createFileRoute } from '@tanstack/react-router'
import GroupSettingsScreen from '@/features/groups/group-settings-screen'

export const Route = createFileRoute('/groups/$id/settings/')({
  component: GroupSettingsScreen,
})
