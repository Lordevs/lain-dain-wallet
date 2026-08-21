import { createFileRoute } from '@tanstack/react-router'
import RecurringPaymentsScreen from '@/features/groups/recurring-payments-screen'
import { useContactLedgers } from '@/features/contacts/hooks/use-contact-ledgers'

export const Route = createFileRoute('/contacts/$id/recurring/')({
  component: function Component() {
    const { id } = Route.useParams()
    const ledgers = useContactLedgers(id)

    if (!ledgers.friendshipId) {
      return (
        <div className="min-h-screen bg-[#FEFAF1] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading recurring payments…</p>
        </div>
      )
    }

    return (
      <RecurringPaymentsScreen
        friendshipId={ledgers.friendshipId}
        contactUserId={id}
        // Pop, don't push — see groups/$id.recurring.index.tsx's comment
        // for why a forward navigate() here caused an infinite back-button
        // ping-pong with the Settings screen.
        onClose={() => window.history.back()}
      />
    )
  },
})
