import { createFileRoute } from '@tanstack/react-router'
import PaymentConfirmationPanel from '@/features/notifications/components/payment-confirmation-panel'

export const Route = createFileRoute('/notifications/confirm/$id')({
  component: PaymentConfirmationPanel,
})
