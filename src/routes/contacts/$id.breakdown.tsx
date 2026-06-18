import { createFileRoute } from '@tanstack/react-router'
import LedgerBreakdownScreen from '@/features/contacts/ledger-breakdown-screen'

export const Route = createFileRoute('/contacts/$id/breakdown')({
  component: LedgerBreakdownScreen,
})
