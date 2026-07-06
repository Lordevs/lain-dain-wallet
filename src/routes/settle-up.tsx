import { createFileRoute } from '@tanstack/react-router'
import SettleUpPanel from '@/features/notifications/components/settle-up-panel'

export interface SettleUpSearch {
  contactId?: string
  groupId?: string
  notificationId?: string
}

export const Route = createFileRoute('/settle-up')({
  validateSearch: (search: Record<string, unknown>): SettleUpSearch => ({
    contactId: typeof search.contactId === 'string' ? search.contactId : undefined,
    groupId: typeof search.groupId === 'string' ? search.groupId : undefined,
    notificationId: typeof search.notificationId === 'string' ? search.notificationId : undefined,
  }),
  component: SettleUpPanel,
})
