import { createFileRoute } from '@tanstack/react-router'
import NotificationsScreen from '@/features/notifications/notifications-screen'
import { z } from 'zod'

const searchSchema = z.object({
  drawer: z.enum(['reminder', 'breakdown', 'transaction']).optional(),
  txId: z.string().optional(),
  contactId: z.string().optional(),
})

export const Route = createFileRoute('/notifications/')({
  validateSearch: searchSchema,
  component: NotificationsScreen,
})
