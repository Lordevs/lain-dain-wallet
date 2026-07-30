import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

export type GroupTransaction =
  | { kind: 'expense'; date: string; data: components['schemas']['ExpenseRead'] }
  | { kind: 'settlement'; date: string; data: components['schemas']['SettlementRead'] }

/** Mirrors useFriendshipTransactionsQuery — merges this group's expenses
 * and settlements into one client-sorted timeline. */
export function useGroupTransactionsQuery(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-transactions', groupId],
    queryFn: async (): Promise<GroupTransaction[]> => {
      const [expensesRes, settlementsRes] = await Promise.all([
        apiClient.GET('/api/expenses/groups/{group_id}/', {
          params: { path: { group_id: groupId! }, query: { page_size: 100 } },
        }),
        apiClient.GET('/api/expenses/groups/{group_id}/settlements/', {
          params: { path: { group_id: groupId! }, query: { page_size: 100 } },
        }),
      ])
      if (expensesRes.error) throw toApiError(expensesRes.error)
      if (settlementsRes.error) throw toApiError(settlementsRes.error)

      const expenses = expensesRes.data.results.map((e) => ({ kind: 'expense' as const, date: e.date, data: e }))
      const settlements = settlementsRes.data.results.map((s) => ({ kind: 'settlement' as const, date: s.date, data: s }))
      return [...expenses, ...settlements].sort((a, b) => b.date.localeCompare(a.date))
    },
    enabled: !!groupId,
  })
}
