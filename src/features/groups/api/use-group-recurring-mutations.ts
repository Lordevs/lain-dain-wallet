import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import {
  appendLedgerExpenseFields,
  ledgerExpenseFields,
  type LedgerExpenseCoreValues,
} from '@/features/expenses/lib/append-ledger-expense-fields'
import { queueMutation } from '@/lib/sync/mutation-outbox'

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

function recurringFields(data: GroupRecurringFormValues, isUpdate: boolean): Array<[string, string]> {
  return [
    ['frequency', data.frequency],
    ...(!isUpdate ? [['start_date', data.startDate] as [string, string]] : []),
    ['next_occurrence', data.nextOccurrence],
    ...ledgerExpenseFields(data),
  ]
}

function recurringMultipart(data: GroupRecurringFormValues, isUpdate: boolean) {
  return {
    fields: recurringFields(data, isUpdate),
    file: data.receipt ? {
      field: 'receipt', sourceUri: data.receipt, filename: 'receipt.jpg', mimeType: 'image/jpeg',
    } : undefined,
  }
}

/** POST /api/expenses/friendships/{friendship_id}/recurring/ */
export function useCreateFriendshipRecurringMutation(friendshipId: string) {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['RecurringExpenseCreate'], ApiError, GroupRecurringFormValues>({
    mutationFn: async (values) => {
      const result = await queueMutation({
        resource: 'recurring', method: 'POST',
        path: `/api/expenses/friendships/${friendshipId}/recurring/`,
        multipart: recurringMultipart(values, false),
        optimisticResult: {} as components['schemas']['RecurringExpenseCreate'],
      })
      return result.data
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
      const result = await queueMutation({
        resource: 'recurring', method: 'PATCH', path: `/api/expenses/recurring/${recurringId}/`,
        multipart: recurringMultipart(values, true),
        optimisticResult: {} as components['schemas']['RecurringExpenseUpdate'],
      })
      return result.data
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
      await queueMutation({
        resource: 'recurring', method: 'DELETE', path: `/api/expenses/recurring/${recurringId}/`,
        optimisticResult: undefined,
      })
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
      const result = await queueMutation({
        resource: 'recurring', method: 'POST', path: `/api/expenses/groups/${groupId}/recurring/`,
        multipart: recurringMultipart(values, false),
        optimisticResult: {} as components['schemas']['RecurringExpenseCreate'],
      })
      return result.data
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
      const result = await queueMutation({
        resource: 'recurring', method: 'PATCH', path: `/api/expenses/recurring/${recurringId}/`,
        multipart: recurringMultipart(values, true),
        optimisticResult: {} as components['schemas']['RecurringExpenseUpdate'],
      })
      return result.data
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
      await queueMutation({
        resource: 'recurring', method: 'DELETE', path: `/api/expenses/recurring/${recurringId}/`,
        optimisticResult: undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-recurring', groupId] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
