import { createFileRoute } from '@tanstack/react-router'
import AddEntryScreen from '@/features/personal/add-entry-screen'

export const Route = createFileRoute('/personal/add')({
  component: AddEntryScreen,
})
