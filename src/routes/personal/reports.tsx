import { createFileRoute } from '@tanstack/react-router'
import ReportsScreen from '@/features/personal/reports-screen'

export const Route = createFileRoute('/personal/reports')({
  component: ReportsScreen,
})
