import { createFileRoute } from '@tanstack/react-router'
import SendReminderScreen from '@/features/contacts/send-reminder-screen'

export const Route = createFileRoute('/contacts/$id/reminder')({
  component: SendReminderScreen,
})
