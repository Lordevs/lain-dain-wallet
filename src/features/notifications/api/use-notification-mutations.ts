import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

type Notification = components['schemas']['Notification']
type PaginatedNotificationList = components['schemas']['PaginatedNotificationList']
type RequestSettlementBody = components['schemas']['RequestSettlementRequestRequest']

const NOTIFICATIONS_LIST_KEY = ['notifications', 'list', 'infinite']
const UNREAD_COUNT_KEY = ['notifications', 'unread-count']

/** POST /api/notifications/{id}/read/ — idempotent; re-marking an
 * already-read notification is a no-op server-side. */
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
            results: page.results.map((n) => (n.id === updated.id ? updated : n)),
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
      const now = new Date().toISOString()
      queryClient.setQueryData<InfiniteData<PaginatedNotificationList>>(NOTIFICATIONS_LIST_KEY, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            results: page.results.map((n) => (n.read_at ? n : { ...n, read_at: now })),
          })),
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
