import { createFileRoute } from '@tanstack/react-router'
import EditContactExpenseScreen from '@/features/contacts/edit-contact-expense-screen'

interface EditExpenseSearch {
  amount?: string
  description?: string
  category?: string
  dateValue?: string
  paidBy?: 'you' | 'contact'
  txId?: string
}

export const Route = createFileRoute('/contacts/$id/edit-expense')({
  validateSearch: (search: Record<string, unknown>): EditExpenseSearch => {
    return {
      amount: typeof search.amount === 'string' ? search.amount : undefined,
      description: typeof search.description === 'string' ? search.description : undefined,
      category: typeof search.category === 'string' ? search.category : undefined,
      dateValue: typeof search.dateValue === 'string' ? search.dateValue : undefined,
      paidBy: (search.paidBy === 'you' || search.paidBy === 'contact') ? search.paidBy : undefined,
      txId: typeof search.txId === 'string' ? search.txId : undefined,
    }
  },
  component: EditContactExpenseScreen,
})
