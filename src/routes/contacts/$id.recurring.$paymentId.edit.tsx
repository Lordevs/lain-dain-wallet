import { createFileRoute } from '@tanstack/react-router'
import AddRecurringScreen from '@/features/groups/add-recurring-screen'
import { useContactLedgers } from '@/features/contacts/hooks/use-contact-ledgers'

export const Route = createFileRoute('/contacts/$id/recurring/$paymentId/edit')({
  component: function Component() {
    const { id, paymentId } = Route.useParams()
    const ledgers = useContactLedgers(id)

    if (!ledgers.friendshipId) {
      return (
        <div className="min-h-screen bg-[#FEFAF1] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading recurring payment…</p>
        </div>
      )
    }

    return (
      <AddRecurringScreen
        friendshipId={ledgers.friendshipId}
        editPaymentId={paymentId}
      />
    )
  },
})
