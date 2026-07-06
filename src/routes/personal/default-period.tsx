import { createFileRoute } from '@tanstack/react-router'
import DefaultPeriodScreen from '@/features/personal/default-period-screen'

export const Route = createFileRoute('/personal/default-period')({
  component: DefaultPeriodScreen,
})
