import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

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
  return useMutation<Notification, ApiError, string>({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST('/api/notifications/{id}/read/', {
        params: { path: { id } },
      })
      if (error) throw toApiError(error)
      return data
    },
    // The full feed refetch this used to trigger (bare ['notifications']
    // invalidation, matching both the list and the unread-count queries)
    // was overkill for flipping one row's read state — patch the cached
    // page in place with the server's own response instead, and only
    // invalidate the one query that actually needs new data.
    onSuccess: (updated) => {
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
      const { error } = await apiClient.POST('/api/notifications/mark-all-read/')
      if (error) throw toApiError(error)
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
      const { error } = await apiClient.DELETE('/api/notifications/{id}/', {
        params: { path: { id } },
      })
      if (error) throw toApiError(error)
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
      const { error } = await apiClient.POST('/api/notifications/clear-all/')
      if (error) throw toApiError(error)
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
      const { error } = await apiClient.POST('/api/notifications/remind/', {
        body,
      })
      if (error) throw toApiError(error)
    },
  })
}

