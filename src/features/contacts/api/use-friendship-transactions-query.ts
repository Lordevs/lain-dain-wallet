import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

export type FriendshipTransaction =
  | { kind: 'expense'; date: string; data: components['schemas']['ExpenseRead'] }
  | { kind: 'settlement'; date: string; data: components['schemas']['SettlementRead'] }

// Expenses and Settlements are two separate models/endpoints server-side
// (see apps/expenses/urls.py), but a friendship's history screen shows
// them as one merged, date-ordered timeline — that merge only makes sense
// client-side, there's no single backend feed for it.
export function useFriendshipTransactionsQuery(friendshipId: string | undefined) {
  return useQuery({
    queryKey: ['friendship-transactions', friendshipId],
    queryFn: async (): Promise<FriendshipTransaction[]> => {
      const [expensesRes, settlementsRes] = await Promise.all([
        apiClient.GET('/api/expenses/friendships/{friendship_id}/', {
          params: { path: { friendship_id: friendshipId! }, query: { page_size: 100 } },
        }),
        apiClient.GET('/api/expenses/friendships/{friendship_id}/settlements/', {
          params: { path: { friendship_id: friendshipId! }, query: { page_size: 100 } },
        }),
      ])
      if (expensesRes.error) throw toApiError(expensesRes.error)
      if (settlementsRes.error) throw toApiError(settlementsRes.error)

      const expenses: FriendshipTransaction[] = expensesRes.data.results.map((e) => ({
        kind: 'expense',
        date: e.date,
        data: e,
      }))
      const settlements: FriendshipTransaction[] = settlementsRes.data.results.map((s) => ({
        kind: 'settlement',
        date: s.date,
        data: s,
      }))

      return [...expenses, ...settlements].sort((a, b) => b.date.localeCompare(a.date))
    },
    enabled: !!friendshipId,
  })
}
