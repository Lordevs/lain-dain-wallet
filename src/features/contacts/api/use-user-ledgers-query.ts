import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

// GET /api/expenses/with/{user_id}/ — the combined balance with this one
// person (`overall`, summed across the direct friendship + every shared
// group) plus the itemized per-ledger breakdown (`ledgers`) behind it.
// Powers both ContactDetailScreen (overall) and LedgerBreakdownScreen
// (ledgers) from the same call. 404s until a relationship (friendship or
// shared group) exists — callers must ensure a Friendship first via
// useCreateFriendshipMutation.
export function useUserLedgersQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-ledgers', userId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/expenses/with/{user_id}/', {
        params: { path: { user_id: userId! } },
      })
      if (error) throw toApiError(error)
      return data
    },
    enabled: !!userId,
  })
}
