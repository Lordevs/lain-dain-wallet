import { createFileRoute } from '@tanstack/react-router'
import SmartSettleScreen from '@/features/groups/smart-settle-screen'

export const Route = createFileRoute('/groups/$id/settings/smart-settle')({
  component: SmartSettleScreen,
})
