import { useQuery, onlineManager } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { useAuthStore } from '@/store/use-auth-store'
import { buildLocalWalletInput } from '@/lib/wallet-local-input'
import { computeLocalWalletList } from '@/lib/wallet-local'
import type { components } from '@/lib/api/schema'

type WalletRow = components['schemas']['WalletRow']

/**
 * GET /api/expenses/wallet/ for one tab, always `type=all&sort=newest`
 * (the backend's own defaults) — every person/group with a nonzero
 * balance state. The tab prioritizes that direction but does not filter rows.
 * Deliberately not re-fetched per filter/sort/search change: the list is
 * already small and bounded (services.wallet_list's own docstring: it's
 * bounded by relationship count, not transaction volume), so the
 * dashboard does its filter/sort/search client-side over this same
 * fetch — one network round trip per tab, not one per tap.
 */
export function useWalletListQuery(tab: 'receivables' | 'payables') {
  return useQuery({
    queryKey: ['wallet', 'list', tab],
    queryFn: async (): Promise<WalletRow[]> => {
      // Offline fallback — same shape as useWalletSummaryQuery's. The tab
      // only re-prioritizes live rows, it never filters them (see this
      // hook's docstring; the dashboard filters/sorts client-side over the
      // full list either way), so the locally computed list is returned
      // whole for both tabs.
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!onlineManager.isOnline() && ownerId) {
        const input = await buildLocalWalletInput(ownerId)
        if (input) return computeLocalWalletList(input)
      }
      // tab/type/sort aren't declared as formal OpenApiParameters on the
      // backend (undocumented but functional — see WalletListView), so
      // the generated query type doesn't include them; the cast below is
      // deliberate, not a typo.
      const { data, error } = await apiClient.GET('/api/expenses/wallet/', {
        params: { query: { tab } } as never,
      })
      if (error) throw toApiError(error)
      return data
    },
    // Balances shift on every expense/settlement write — hold nothing
    // stale here, unlike the global 30s default.
    staleTime: 0,
    networkMode: 'always',
  })
}
