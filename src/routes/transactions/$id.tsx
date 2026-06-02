import { createFileRoute } from '@tanstack/react-router'
// TODO: Replace null with TransactionDetailPage component
export const Route = createFileRoute('/transactions/$id')({ component: () => null })
