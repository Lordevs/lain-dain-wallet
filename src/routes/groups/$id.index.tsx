import { createFileRoute } from '@tanstack/react-router'
import GroupDetailScreen from '@/features/groups/group-detail-screen'

export interface GroupSearch {
  drawer?: 'reminder' | 'add-expense' | 'edit-expense' | 'transaction'
  txId?: string
}

export const Route = createFileRoute('/groups/$id/')({
  validateSearch: (search: Record<string, unknown>): GroupSearch => {
    return {
      drawer: (search.drawer === 'reminder' || search.drawer === 'add-expense' || search.drawer === 'edit-expense' || search.drawer === 'transaction') ? search.drawer : undefined,
      txId: typeof search.txId === 'string' ? search.txId : undefined,
    }
  },
  component: GroupDetailScreen,
})

