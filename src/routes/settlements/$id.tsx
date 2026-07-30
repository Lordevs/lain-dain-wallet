import { createFileRoute } from '@tanstack/react-router'
import SettlementDetailScreen from '@/features/settle-up/settlement-detail-screen'

export const Route = createFileRoute('/settlements/$id')({
  component: SettlementDetailScreen,
})
