import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

type WalletRow = components['schemas']['WalletRow']

/**
 * GET /api/expenses/wallet/ for one tab, always `type=all&sort=newest`
 * (the backend's own defaults) — every person/group with a nonzero
 * balance in that direction, unfiltered and unsorted beyond recency.
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
  })
}
