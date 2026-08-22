import { useQuery, onlineManager } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { useAuthStore } from '@/store/use-auth-store'
import { getLocalExpenses } from '@/lib/sqlite/expenses-store'
import { getResourceSnapshot, getSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import {
  computeSimplifiedBalances,
  computeUnsimplifiedBalances,
  resolveUserSummaries,
  toPersonBalances,
} from '@/lib/ledger-math'
import type { components } from '@/lib/api/schema'

type SettlementRead = components['schemas']['SettlementRead']

/** GET /api/expenses/groups/{group_id}/balance/ — "who do I pay, who pays
 * me, in this group," per member. Respects the group's Smart Settle
 * setting server-side (and the offline fallback below mirrors that same
 * branch locally, from the group's own cached `smart_settle_enabled`). */
export function useGroupBalanceQuery(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-balance', groupId],
    queryFn: async () => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!onlineManager.isOnline() && ownerId && groupId) {
        const [expenses, settlements, group] = await Promise.all([
          getLocalExpenses(ownerId, { groupId }),
          getResourceSnapshot<SettlementRead>(ownerId, 'settlement-ledger', groupId),
          getSnapshotRecord<components['schemas']['Group']>(ownerId, 'groups', groupId),
        ])
        const confirmed = settlements.filter((s) => s.status === 'confirmed')
        const balances = group?.smart_settle_enabled
          ? computeSimplifiedBalances(expenses, confirmed, ownerId)
          : computeUnsimplifiedBalances(expenses, confirmed, ownerId)
        return toPersonBalances(balances, resolveUserSummaries(expenses, confirmed))
      }
      const { data, error } = await apiClient.GET('/api/expenses/groups/{group_id}/balance/', {
        params: { path: { group_id: groupId! } },
      })
      if (error) throw toApiError(error)
      return data
    },
    enabled: !!groupId,
    networkMode: 'always',
  })
}
