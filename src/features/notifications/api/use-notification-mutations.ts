import { useMutation, useQueryClient, onlineManager, type InfiniteData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { useAuthStore } from '@/store/use-auth-store'
import {
  deleteSnapshotRecord,
  getSnapshotRecord,
  transformResourceSnapshot,
  upsertSnapshotRecord,
} from '@/lib/sqlite/resource-snapshot-store'

type Notification = components['schemas']['Notification']
type PaginatedNotificationList = components['schemas']['PaginatedNotificationList']
type RequestSettlementBody = components['schemas']['RequestSettlementRequestRequest']

const NOTIFICATIONS_LIST_KEY = ['notifications', 'list', 'infinite']
const UNREAD_COUNT_KEY = ['notifications', 'unread-count']

/** POST /api/notifications/{id}/read/. Informational notifications are
 * removed by the server once read; pending actions remain until completed
 * or explicitly ignored. */
export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient()
  return useMutation<Notification | undefined, ApiError, string>({
    mutationFn: async (id: string) => {
      const cached = queryClient.getQueryData<InfiniteData<PaginatedNotificationList>>(NOTIFICATIONS_LIST_KEY)
        ?.pages.flatMap((page) => page.results).find((item) => item.id === id)
      const ownerId = useAuthStore.getState().userProfile?.id
      const local = cached ?? (ownerId
        ? await getSnapshotRecord<Notification>(ownerId, 'notifications', id)
        : null)
      // Skipping the queue only when genuinely online (nothing to persist
      // for durability) — not just whenever there's no cached copy, which
      // used to mean an offline tap on a notification the client never
      // cached (a push-triggered deep link, say) threw instead of queueing.
      if (!local && onlineManager.isOnline()) {
        const { data, error } = await apiClient.POST('/api/notifications/{id}/read/', {
          params: { path: { id } },
        })
        if (error) throw toApiError(error)
        return data
      }
      if (!local) {
        // Offline with nothing cached to build a typed optimistic
        // Notification from — still queue the actual mutation (so the
        // action isn't lost), just without patching any local cache;
        // onSuccess below falls back to broad invalidation for this case,
        // same "we don't have the full object" pattern already used by
        // useCancelSettlementMutation.
        await queueMutation({
          resource: 'notifications', method: 'POST', path: `/api/notifications/${id}/read/`,
          optimisticResult: undefined,
        })
        return undefined
      }
      const updated = (await queueMutation({
        resource: 'notifications', method: 'POST', path: `/api/notifications/${id}/read/`,
        optimisticResult: { ...local, read_at: new Date().toISOString() },
      })).data
      if (ownerId) {
        if (updated.action_status === 'none') await deleteSnapshotRecord(ownerId, 'notifications', id)
        else await upsertSnapshotRecord(ownerId, 'notifications', { id, data: updated })
      }
      return updated
    },
    // The full feed refetch this used to trigger (bare ['notifications']
    // invalidation, matching both the list and the unread-count queries)
    // was overkill for flipping one row's read state — patch the cached
    // page in place with the server's own response instead, and only
    // invalidate the one query that actually needs new data.
    onSuccess: (updated) => {
      if (!updated) {
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_LIST_KEY })
        queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
        return
      }
      queryClient.setQueryData<InfiniteData<PaginatedNotificationList>>(NOTIFICATIONS_LIST_KEY, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            results: updated.action_status === 'none'
              ? page.results.filter((n) => n.id !== updated.id)
              : page.results.map((n) => (n.id === updated.id ? updated : n)),
          })),
        }
      })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
    },
  })
}

/** POST /api/notifications/mark-all-read/ */
export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      await queueMutation({
        resource: 'notifications', method: 'POST', path: '/api/notifications/mark-all-read/',
        optimisticResult: undefined,
      })
      const ownerId = useAuthStore.getState().userProfile?.id
      if (ownerId) {
        await transformResourceSnapshot<Notification>(ownerId, 'notifications', (items) =>
          items.filter((item) => item.action_status !== 'none').map((item) => ({
            ...item, read_at: item.read_at ?? new Date().toISOString(),
          })))
      }
    },
    onSuccess: () => {
      queryClient.setQueryData<InfiniteData<PaginatedNotificationList>>(NOTIFICATIONS_LIST_KEY, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            // Informational rows are deleted server-side. Pending actions
            // deliberately remain visible even after being marked read.
            results: page.results.filter((n) => n.action_status !== 'none'),
          })),
        }
      })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
    },
  })
}

/** DELETE /api/notifications/{id}/ — soft-delete. The row is actually gone
 * server-side by the time this resolves; the "undo" window is handled
 * entirely client-side by the caller delaying this call until an undo
 * toast expires (see notifications-screen.tsx), so there's no restore
 * endpoint to call back into. */
export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, string>({
    mutationFn: async (id: string) => {
      await queueMutation({
        resource: 'notifications', method: 'DELETE', path: `/api/notifications/${id}/`,
        optimisticResult: undefined,
      })
      const ownerId = useAuthStore.getState().userProfile?.id
      if (ownerId) await deleteSnapshotRecord(ownerId, 'notifications', id)
    },
    onSuccess: (_data, id) => {
      queryClient.setQueryData<InfiniteData<PaginatedNotificationList>>(NOTIFICATIONS_LIST_KEY, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            results: page.results.filter((n) => n.id !== id),
          })),
        }
      })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
    },
  })
}

/** POST /api/notifications/clear-all/ — soft-deletes every notification
 * (read and unread) for the caller. */
export function useClearAllNotificationsMutation() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      await queueMutation({
        resource: 'notifications', method: 'POST', path: '/api/notifications/clear-all/',
        optimisticResult: undefined,
      })
      const ownerId = useAuthStore.getState().userProfile?.id
      if (ownerId) await transformResourceSnapshot<Notification>(ownerId, 'notifications', () => [])
    },
    onSuccess: () => {
      queryClient.setQueryData<InfiniteData<PaginatedNotificationList>>(NOTIFICATIONS_LIST_KEY, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({ ...page, results: [] })),
        }
      })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
    },
  })
}

/** POST /api/notifications/remind/ — the 'Remind' nudge behind the
 * late_payment_reminder card and the settlement_request flow. Exactly one
 * of friendship_id/group_id must be given; the amount is always
 * server-derived, never client-supplied. */
export function useRequestSettlementMutation() {
  return useMutation<void, ApiError, RequestSettlementBody>({
    mutationFn: async (body: RequestSettlementBody) => {
      await queueMutation({
        resource: 'notifications', method: 'POST', path: '/api/notifications/remind/',
        body, optimisticResult: undefined,
      })
    },
  })
}
