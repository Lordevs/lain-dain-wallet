import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

export interface GroupRecurringFormValues {
  description: string
  amount: string
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly'
  startDate: string // YYYY-MM-DD
  nextOccurrence: string // YYYY-MM-DD
  categoryId: string
  note?: string
  receipt?: string | File | null
  splitType: 'equal' | 'unequal' | 'adjustment'
  payers: { user_id: string; amount: string }[]
  splits: ({ user_id: string } | { user_id: string; amount_owed: string } | { user_id: string; extra_amount: string })[]
}

async function buildRecurringExpenseFormData(data: GroupRecurringFormValues, isUpdate = false): Promise<FormData> {
  const formData = new FormData()
  formData.append('description', data.description)
  formData.append('amount', data.amount)
  formData.append('frequency', data.frequency)
  if (!isUpdate) {
    formData.append('start_date', data.startDate)
  }
  formData.append('next_occurrence', data.nextOccurrence)
  formData.append('category_id', data.categoryId)
  if (data.note) formData.append('note', data.note)
  formData.append('split_type', data.splitType)
  formData.append('payers', JSON.stringify(data.payers))
  formData.append('splits', JSON.stringify(data.splits))

  if (data.receipt) {
    if (typeof data.receipt === 'string' && (data.receipt.startsWith('blob:') || data.receipt.startsWith('data:'))) {
      try {
        const blob = await fetch(data.receipt).then((res) => res.blob())
        formData.append('receipt', blob, 'receipt.jpg')
      } catch (err) {
        console.warn('Failed to fetch receipt blob:', err)
      }
    } else if (data.receipt instanceof File) {
      formData.append('receipt', data.receipt)
    }
  }

  return formData
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
