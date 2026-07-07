import { createFileRoute, useParams } from '@tanstack/react-router'
import EditContactExpenseScreen from '@/features/contacts/edit-contact-expense-screen'
import EditGroupExpenseScreen from '@/features/groups/edit-group-expense-screen'
import { useTransactionStore } from '@/store/use-transaction-store'
import { useContactStore } from '@/store/use-contact-store'

function EditTransactionRouteComponent() {
  const { id: txId } = useParams({ from: '/transactions/$id/edit' })

  const transactionsByContact = useTransactionStore((state) => state.transactionsByContact)
  let foundContactId = ''
  for (const cId in transactionsByContact) {
    const t = transactionsByContact[cId].find((item) => item.id === txId)
    if (t) {
      foundContactId = cId
      break
    }
  }

  const contacts = useContactStore((state) => state.contacts)
  const contact = contacts.find((c) => c.id === foundContactId)

  if (contact?.type === 'group') {
    return <EditGroupExpenseScreen />
  }

  return <EditContactExpenseScreen />
}

export const Route = createFileRoute('/transactions/$id/edit')({
  component: EditTransactionRouteComponent,
})
