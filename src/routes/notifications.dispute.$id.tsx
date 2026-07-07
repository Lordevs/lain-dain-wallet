import { createFileRoute } from '@tanstack/react-router'
import PaymentDisputePanel from '@/features/notifications/components/payment-dispute-panel'

export const Route = createFileRoute('/notifications/dispute/$id')({
  component: PaymentDisputePanel,
})
