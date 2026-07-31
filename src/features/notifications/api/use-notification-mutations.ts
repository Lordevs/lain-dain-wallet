import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

type Notification = components['schemas']['Notification']
type RequestSettlementBody = components['schemas']['RequestSettlementRequestRequest']

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
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
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
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
