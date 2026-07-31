import { createFileRoute, useNavigate } from '@tanstack/react-router'
import RecurringPaymentsScreen from '@/features/groups/recurring-payments-screen'
import { useContactLedgers } from '@/features/contacts/hooks/use-contact-ledgers'
import { ROUTES } from '@/constants/routes'

export const Route = createFileRoute('/contacts/$id/recurring/')({
  component: function Component() {
    const { id } = Route.useParams()
    const navigate = useNavigate()
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
        onClose={() => navigate({ to: ROUTES.CONTACT_SETTINGS, params: { id } })}
      />
    )
  },
})
