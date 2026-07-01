import { createFileRoute } from '@tanstack/react-router'
import PersonalSettingsScreen from '@/features/personal/settings-screen'

export const Route = createFileRoute('/personal/settings')({
  component: PersonalSettingsScreen,
})
