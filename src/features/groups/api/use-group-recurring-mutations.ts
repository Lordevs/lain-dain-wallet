import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { appendLedgerExpenseFields, type LedgerExpenseCoreValues } from '@/features/expenses/lib/append-ledger-expense-fields'

export interface GroupRecurringFormValues extends LedgerExpenseCoreValues {
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly'
  startDate: string // YYYY-MM-DD
  nextOccurrence: string // YYYY-MM-DD
}

export async function buildRecurringExpenseFormData(data: GroupRecurringFormValues, isUpdate = false): Promise<FormData> {
  const formData = new FormData()
  formData.append('frequency', data.frequency)
  if (!isUpdate) {
    formData.append('start_date', data.startDate)
  }
  formData.append('next_occurrence', data.nextOccurrence)
  await appendLedgerExpenseFields(formData, data)
  return formData
}

/** POST /api/expenses/friendships/{friendship_id}/recurring/ */
export function useCreateFriendshipRecurringMutation(friendshipId: string) {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['RecurringExpenseCreate'], ApiError, GroupRecurringFormValues>({
    mutationFn: async (values) => {
      const formData = await buildRecurringExpenseFormData(values, false)
      const { data, error } = await apiClient.POST('/api/expenses/friendships/{friendship_id}/recurring/', {
        params: { path: { friendship_id: friendshipId } },
        body: formData as unknown as components['schemas']['RecurringExpenseCreateRequest'],
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendship-recurring', friendshipId] })
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateFriendshipRecurringMutation(friendshipId: string, recurringId: string) {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['RecurringExpenseUpdate'], ApiError, GroupRecurringFormValues>({
    mutationFn: async (values) => {
      const formData = await buildRecurringExpenseFormData(values, true)
      const { data, error } = await apiClient.PATCH('/api/expenses/recurring/{id}/', {
        params: { path: { id: recurringId } },
        body: formData as unknown as components['schemas']['PatchedRecurringExpenseUpdateRequest'],
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendship-recurring', friendshipId] })
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteFriendshipRecurringMutation(friendshipId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: async (recurringId) => {
      const { error } = await apiClient.DELETE('/api/expenses/recurring/{id}/', {
        params: { path: { id: recurringId } },
      })
      if (error) throw toApiError(error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendship-recurring', friendshipId] })
    },
    onError: (error) => toast.error(error.message),
  })
}

/** POST /api/expenses/groups/{group_id}/recurring/ — Create group recurring payment */
export function useCreateGroupRecurringMutation(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['RecurringExpenseCreate'], ApiError, GroupRecurringFormValues>({
    mutationFn: async (values: GroupRecurringFormValues) => {
      const formData = await buildRecurringExpenseFormData(values, false)
      const { data, error } = await apiClient.POST('/api/expenses/groups/{group_id}/recurring/', {
        params: { path: { group_id: groupId } },
        body: formData as unknown as components['schemas']['RecurringExpenseCreateRequest'],
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-recurring', groupId] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

/** PATCH /api/expenses/recurring/{id}/ — Update recurring payment */
export function useUpdateGroupRecurringMutation(groupId: string, recurringId: string) {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['RecurringExpenseUpdate'], ApiError, GroupRecurringFormValues>({
    mutationFn: async (values: GroupRecurringFormValues) => {
      const formData = await buildRecurringExpenseFormData(values, true)
      const { data, error } = await apiClient.PATCH('/api/expenses/recurring/{id}/', {
        params: { path: { id: recurringId } },
        body: formData as unknown as components['schemas']['PatchedRecurringExpenseUpdateRequest'],
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-recurring', groupId] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

/** DELETE /api/expenses/recurring/{id}/ — Delete recurring payment */
export function useDeleteGroupRecurringMutation(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: async (recurringId: string) => {
      const { error } = await apiClient.DELETE('/api/expenses/recurring/{id}/', {
        params: { path: { id: recurringId } },
      })
      if (error) throw toApiError(error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-recurring', groupId] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
