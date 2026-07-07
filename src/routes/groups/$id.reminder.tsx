import { createFileRoute } from '@tanstack/react-router'
import SendGroupReminderScreen from '@/features/groups/send-group-reminder-screen'

export const Route = createFileRoute('/groups/$id/reminder')({
  component: SendGroupReminderScreen,
})
