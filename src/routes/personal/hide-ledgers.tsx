import { createFileRoute } from '@tanstack/react-router'
import HideLedgersScreen from '@/features/personal/hide-ledgers-screen'

export const Route = createFileRoute('/personal/hide-ledgers')({
  component: HideLedgersScreen,
})
