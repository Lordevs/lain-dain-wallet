import { createFileRoute } from '@tanstack/react-router'
import AddContactExpenseScreen from '@/features/contacts/add-contact-expense-screen'

export const Route = createFileRoute('/contacts/$id/add-expense')({
  component: AddContactExpenseScreen,
})
