import { createFileRoute } from '@tanstack/react-router'
import AdjustBalancesScreen from '@/features/contacts/adjust-balances-screen'

export const Route = createFileRoute('/contacts/$id/adjust')({
  component: AdjustBalancesScreen,
})
