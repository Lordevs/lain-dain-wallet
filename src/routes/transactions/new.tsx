import { createFileRoute } from '@tanstack/react-router'
// TODO: Replace null with NewTransactionPage component
export const Route = createFileRoute('/transactions/new')({ component: () => null })
