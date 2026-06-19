import { createFileRoute } from '@tanstack/react-router'
import ContactDetailScreen from '@/features/contacts/contact-detail-screen'

export interface ContactSearch {
  drawer?: 'reminder' | 'breakdown' | 'add-expense' | 'edit-expense' | 'transaction'
  txId?: string
}

export const Route = createFileRoute('/contacts/$id/')({
  validateSearch: (search: Record<string, unknown>): ContactSearch => {
    return {
      drawer: (search.drawer === 'reminder' || search.drawer === 'breakdown' || search.drawer === 'add-expense' || search.drawer === 'edit-expense' || search.drawer === 'transaction') ? search.drawer : undefined,
      txId: typeof search.txId === 'string' ? search.txId : undefined,
    }
  },
  component: ContactDetailScreen,
})

