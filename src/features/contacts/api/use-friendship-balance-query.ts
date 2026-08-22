import { useQuery, onlineManager } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { useAuthStore } from '@/store/use-auth-store'
import { getLocalExpenses } from '@/lib/sqlite/expenses-store'
import { getResourceSnapshot } from '@/lib/sqlite/resource-snapshot-store'
import { computeUnsimplifiedBalances, resolveUserSummaries, toPersonBalances } from '@/lib/ledger-math'
import type { components } from '@/lib/api/schema'

type SettlementRead = components['schemas']['SettlementRead']

/** Direct 1:1 balance only; shared-group balances are deliberately excluded. */
export function useFriendshipBalanceQuery(friendshipId: string | undefined) {
  return useQuery({
    queryKey: ['friendship-balance', friendshipId],
    queryFn: async () => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!onlineManager.isOnline() && ownerId && friendshipId) {
        const [expenses, settlements] = await Promise.all([
          getLocalExpenses(ownerId, { friendshipId }),
          getResourceSnapshot<SettlementRead>(ownerId, 'settlement-ledger', friendshipId),
        ])
        const confirmed = settlements.filter((s) => s.status === 'confirmed')
        const balances = computeUnsimplifiedBalances(expenses, confirmed, ownerId)
        return toPersonBalances(balances, resolveUserSummaries(expenses, confirmed))
      }
      const { data, error } = await apiClient.GET('/api/expenses/friendships/{friendship_id}/balance/', {
        params: { path: { friendship_id: friendshipId! } },
      })
      if (error) throw toApiError(error)
      return data
    },
    enabled: !!friendshipId,
    networkMode: 'always',
  })
}
