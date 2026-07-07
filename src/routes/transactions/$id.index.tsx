import { createFileRoute } from '@tanstack/react-router'
import TransactionDetailScreen from '@/features/transactions/transaction-detail-screen'

export const Route = createFileRoute('/transactions/$id/')({
  component: TransactionDetailScreen,
})
