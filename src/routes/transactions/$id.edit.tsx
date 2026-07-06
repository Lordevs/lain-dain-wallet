import { createFileRoute } from '@tanstack/react-router'
import EditContactExpenseScreen from '@/features/contacts/edit-contact-expense-screen'

export const Route = createFileRoute('/transactions/$id/edit')({
  component: EditContactExpenseScreen,
})
