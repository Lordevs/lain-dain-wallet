import { createFileRoute } from '@tanstack/react-router'
import ContactSettingsScreen from '@/features/contacts/contact-settings-screen'

export const Route = createFileRoute('/contacts/$id/settings')({
  component: ContactSettingsScreen,
})
