import { createFileRoute } from '@tanstack/react-router'
import ContactDetailScreen from '@/features/contacts/contact-detail-screen'

export const Route = createFileRoute('/contacts/$id')({
  component: ContactDetailScreen,
})
