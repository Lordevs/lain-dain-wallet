import { createFileRoute } from '@tanstack/react-router'
// TODO: Replace null with ContactDetailPage component
export const Route = createFileRoute('/contacts/$id')({ component: () => null })
