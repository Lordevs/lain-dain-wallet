import { createFileRoute } from '@tanstack/react-router'
import SettlementDetailScreen from '@/features/settle-up/settlement-detail-screen'

export interface SettlementDetailSearch {
  fromNotification?: boolean
}

export const Route = createFileRoute('/settlements/$id')({
  validateSearch: (search: Record<string, unknown>): SettlementDetailSearch => ({
    fromNotification: search.fromNotification === true || search.fromNotification === 'true',
  }),
  component: SettlementDetailScreen,
})
