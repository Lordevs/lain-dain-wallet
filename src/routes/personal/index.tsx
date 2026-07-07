import { createFileRoute } from '@tanstack/react-router'
import PersonalScreen from '@/features/personal/personal-screen'

export const Route = createFileRoute('/personal/')({
  component: PersonalScreen,
})

