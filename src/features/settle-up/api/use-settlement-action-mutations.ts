import { useMutation, useQueryClient, onlineManager } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { useAuthStore } from '@/store/use-auth-store'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import {
  deleteSnapshotRecord,
  getSnapshotRecord,
  upsertSnapshotRecord,
} from '@/lib/sqlite/resource-snapshot-store'

type SettlementRead = components['schemas']['SettlementRead']

// A Settlement always has exactly one payer/payee pair regardless of
// friendship-vs-group context, so "the other user" is always unambiguous.
function otherUserId(settlement: Pick<SettlementRead, 'payer' | 'payee'>): string | undefined {
  const myId = useAuthStore.getState().userProfile?.id
  return myId === settlement.payer.id ? settlement.payee.id : settlement.payer.id
}

function invalidateForSettlement(queryClient: ReturnType<typeof useQueryClient>, settlement: SettlementRead) {
  queryClient.invalidateQueries({ queryKey: ['settlement', settlement.id] })
  if (settlement.friendship) {
    queryClient.invalidateQueries({ queryKey: ['friendship-transactions', settlement.friendship] })
  }
  if (settlement.group) {
    queryClient.invalidateQueries({ queryKey: ['group-transactions', settlement.group] })
    queryClient.invalidateQueries({ queryKey: ['group-balance', settlement.group] })
  }
  queryClient.invalidateQueries({ queryKey: ['user-ledgers', otherUserId(settlement)] })
  queryClient.invalidateQueries({ queryKey: ['wallet'] })
  queryClient.invalidateQueries({ queryKey: ['notifications'] })
}

/** Same intent as invalidateForSettlement, for the rare case there's no
 * local copy of the settlement to read friendship/group/other-party from
 * (queued offline with nothing cached — see the two mutations below) — a
 * broader net across every scope-scoped query instead of a targeted one. */
function invalidateBroadlyForSettlement(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  queryClient.invalidateQueries({ queryKey: ['settlement', id] })
  queryClient.invalidateQueries({ queryKey: ['friendship-transactions'] })
  queryClient.invalidateQueries({ queryKey: ['group-transactions'] })
  queryClient.invalidateQueries({ queryKey: ['group-balance'] })
  queryClient.invalidateQueries({ queryKey: ['user-ledgers'] })
  queryClient.invalidateQueries({ queryKey: ['wallet'] })
  queryClient.invalidateQueries({ queryKey: ['notifications'] })
}

/** POST /api/expenses/settlements/{id}/confirm/ — only the party who
 * isn't recorded_by can confirm a pending settlement; applies the ledger
 * update immediately on success. */
export function useConfirmSettlementMutation() {
  const queryClient = useQueryClient()
  return useMutation<SettlementRead | undefined, ApiError, string>({
    mutationFn: async (id: string) => {
      const ownerId = useAuthStore.getState().userProfile?.id
      const cached = queryClient.getQueryData<SettlementRead>(['settlement', id])
        ?? (ownerId ? await getSnapshotRecord<SettlementRead>(ownerId, 'settlements', id) : null)
      // Skipping the queue only when genuinely online — not just whenever
      // there's no cached copy, which used to mean confirming a
      // never-viewed settlement while offline threw instead of queueing.
      if (!cached && onlineManager.isOnline()) {
        const { data, error } = await apiClient.POST('/api/expenses/settlements/{id}/confirm/', {
          params: { path: { id } },
        })
        if (error) throw toApiError(error)
        return data
      }
      if (!cached) {
        // Offline with nothing cached to build a typed optimistic
        // SettlementRead from (payer/payee/amount/etc. all unknown) —
        // still queue the actual mutation so the confirmation isn't lost;
        // onSuccess falls back to a broad invalidation for this case.
        await queueMutation({
          resource: 'settlements', method: 'POST',
          path: `/api/expenses/settlements/${id}/confirm/`, optimisticResult: undefined,
        })
        return undefined
      }
      const updated = (await queueMutation({
        resource: 'settlements', method: 'POST',
        path: `/api/expenses/settlements/${id}/confirm/`,
        optimisticResult: { ...cached, status: 'confirmed' as const },
      })).data
      if (ownerId) await upsertSnapshotRecord(ownerId, 'settlements', {
        id, scopeId: updated.group ?? updated.friendship ?? null, data: updated,
      })
      return updated
    },
    onSuccess: (data, id) => {
      if (data) invalidateForSettlement(queryClient, data)
      else invalidateBroadlyForSettlement(queryClient, id)
    },
  })
}

/** POST /api/expenses/settlements/{id}/dispute/ — either non-recording
 * party can dispute; if the settlement had already touched the ledger
 * (confirmed pay-mode, or auto-confirmed receive-mode), a reversal entry
 * is posted server-side. Terminal — no un-dispute path. */
export function useDisputeSettlementMutation() {
  const queryClient = useQueryClient()
  return useMutation<SettlementRead | undefined, ApiError, string>({
    mutationFn: async (id: string) => {
      const ownerId = useAuthStore.getState().userProfile?.id
      const cached = queryClient.getQueryData<SettlementRead>(['settlement', id])
        ?? (ownerId ? await getSnapshotRecord<SettlementRead>(ownerId, 'settlements', id) : null)
      // Skipping the queue only when genuinely online — not just whenever
      // there's no cached copy, which used to mean disputing a
      // never-viewed settlement while offline threw instead of queueing.
      if (!cached && onlineManager.isOnline()) {
        const { data, error } = await apiClient.POST('/api/expenses/settlements/{id}/dispute/', {
          params: { path: { id } },
        })
        if (error) throw toApiError(error)
        return data
      }
      if (!cached) {
        // Offline with nothing cached to build a typed optimistic
        // SettlementRead from (payer/payee/amount/etc. all unknown) —
        // still queue the actual mutation so the dispute isn't lost;
        // onSuccess falls back to a broad invalidation for this case.
        await queueMutation({
          resource: 'settlements', method: 'POST',
          path: `/api/expenses/settlements/${id}/dispute/`, optimisticResult: undefined,
        })
        return undefined
      }
      const updated = (await queueMutation({
        resource: 'settlements', method: 'POST',
        path: `/api/expenses/settlements/${id}/dispute/`,
        optimisticResult: { ...cached, status: 'disputed' as const },
      })).data
      if (ownerId) await upsertSnapshotRecord(ownerId, 'settlements', {
        id, scopeId: updated.group ?? updated.friendship ?? null, data: updated,
      })
      return updated
    },
    onSuccess: (data, id) => {
      if (data) invalidateForSettlement(queryClient, data)
      else invalidateBroadlyForSettlement(queryClient, id)
    },
  })
}

/** POST /api/expenses/settlements/{id}/cancel/ — only recorded_by, only
 * while pending (never touched the ledger yet, so this is a hard delete
 * server-side, no reversal needed). 204 No Content. */
export function useCancelSettlementMutation() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, { id: string; friendshipId?: string | null; groupId?: string | null }>({
    mutationFn: async ({ id }) => {
      await queueMutation({
        resource: 'settlements', method: 'POST',
        path: `/api/expenses/settlements/${id}/cancel/`, optimisticResult: undefined,
      })
      const ownerId = useAuthStore.getState().userProfile?.id
      if (ownerId) await deleteSnapshotRecord(ownerId, 'settlements', id)
    },
    onSuccess: (_data, { id, friendshipId, groupId }) => {
      // Cancel is a 204 (no body), so payer/payee aren't in the response —
      // read from whatever's already cached from viewing the settlement
      // detail screen (reliably present in practice), falling back to
      // broad invalidation if it genuinely isn't cached.
      const cached = queryClient.getQueryData<SettlementRead>(['settlement', id])
      queryClient.invalidateQueries({ queryKey: ['settlement', id] })
      if (friendshipId) queryClient.invalidateQueries({ queryKey: ['friendship-transactions', friendshipId] })
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ['group-transactions', groupId] })
        queryClient.invalidateQueries({ queryKey: ['group-balance', groupId] })
      }
      queryClient.invalidateQueries({ queryKey: cached ? ['user-ledgers', otherUserId(cached)] : ['user-ledgers'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
