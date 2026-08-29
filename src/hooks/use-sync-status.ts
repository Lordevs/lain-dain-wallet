import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/use-auth-store'
import {
  getExpenseOutboxSummary,
  retryFailedExpenseRows,
} from '@/lib/sqlite/outbox-store'
import {
  discardFailedRejectedDeletes,
  getMutationOutboxSummary,
  retryFailedMutations,
} from '@/lib/sqlite/mutation-outbox-store'
import { syncOfflineData } from '@/lib/sync/triggers'

export function useSyncStatus() {
  const ownerId = useAuthStore((state) => state.userProfile?.id)
  const queryClient = useQueryClient()
  const [isRetrying, setIsRetrying] = useState(false)
  const isDiscardingRejectedDeletes = useRef(false)
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
        failedRejectedDeletes: mutations.failedRejectedDeletes,
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

  useEffect(() => {
    if (!ownerId || !query.data?.failedRejectedDeletes || isDiscardingRejectedDeletes.current) return
    // Builds released before permanent rejections were auto-discarded may
    // already have stale category/group delete rows. Clear those once and
    // pull canonical snapshots back without asking the user to manage an
    // implementation detail from the header.
    isDiscardingRejectedDeletes.current = true
    void (async () => {
      try {
        await discardFailedRejectedDeletes(ownerId)
        await syncOfflineData({ force: true })
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['categories'] }),
          queryClient.invalidateQueries({ queryKey: ['groups'] }),
          queryClient.invalidateQueries({ queryKey: ['wallet'] }),
          queryClient.invalidateQueries({ queryKey: ['offline-sync-status', ownerId] }),
        ])
      } finally {
        isDiscardingRejectedDeletes.current = false
      }
    })()
  }, [ownerId, query.data?.failedRejectedDeletes, queryClient])

  return {
    pending: query.data?.pending ?? 0,
    failed: query.data?.failed ?? 0,
    firstError: query.data?.firstError ?? null,
    isRetrying,
    retry,
  }
}
