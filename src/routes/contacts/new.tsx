import { createFileRoute } from '@tanstack/react-router'
import NewContactScreen from '@/features/contacts/new-contact-screen'

export const Route = createFileRoute('/contacts/new')({
  component: NewContactScreen,
})
