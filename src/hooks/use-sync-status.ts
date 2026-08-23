import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuthStore } from '@/store/use-auth-store'
import {
  getExpenseOutboxSummary,
  retryFailedExpenseRows,
} from '@/lib/sqlite/outbox-store'
import {
  getMutationOutboxSummary,
  retryFailedMutations,
} from '@/lib/sqlite/mutation-outbox-store'
import { syncOfflineData } from '@/lib/sync/triggers'

export function useSyncStatus() {
  const ownerId = useAuthStore((state) => state.userProfile?.id)
  const queryClient = useQueryClient()
  const [isRetrying, setIsRetrying] = useState(false)
  const query = useQuery({
    queryKey: ['offline-sync-status', ownerId],
    queryFn: async () => {
      const [expenses, mutations] = await Promise.all([
        getExpenseOutboxSummary(ownerId!),
        getMutationOutboxSummary(ownerId!),
      ])
      return {
        pending: expenses.pending + mutations.pending,
        failed: expenses.failed + mutations.failed,
        firstError: expenses.firstError ?? mutations.firstError,
      }
    },
    enabled: !!ownerId,
    refetchInterval: 2_000,
    // queryFn is 100% local SQLite reads, no network involved — without
    // this, TanStack's default networkMode ('online') pauses the query
    // whenever the device is offline, so the one banner meant to show
    // "N changes queued, will sync when back online" goes blank at
    // exactly the moment offline users need it most.
    networkMode: 'always',
  })

  const retry = async () => {
    if (!ownerId || isRetrying) return
    setIsRetrying(true)
    try {
      await Promise.all([retryFailedExpenseRows(ownerId), retryFailedMutations(ownerId)])
      await syncOfflineData({ force: true })
      await queryClient.invalidateQueries({ queryKey: ['offline-sync-status', ownerId] })
    } finally {
      setIsRetrying(false)
    }
  }

  return {
    pending: query.data?.pending ?? 0,
    failed: query.data?.failed ?? 0,
    firstError: query.data?.firstError ?? null,
    isRetrying,
    retry,
  }
}
