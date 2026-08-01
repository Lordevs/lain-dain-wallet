import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { buildExpenseUpdateFormData, type ExpenseUpdateFormValues } from '../lib/build-expense-update-form-data'

interface UpdateExpenseVariables {
  id: string
  values: ExpenseUpdateFormValues
  // The expense's own context — callers already have this from the
  // ExpenseRead they loaded to build the edit form (expense.friendship /
  // expense.group), so passing it through costs nothing and lets
  // invalidation target only the one friendship/group actually affected,
  // matching the ['friendship-transactions', id] / ['group-transactions',
  // id] scoping every other mutation in the app already uses.
  friendshipId?: string
  groupId?: string
}

export function useUpdateExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['ExpenseUpdate'], ApiError, UpdateExpenseVariables>({
    mutationFn: async ({ id, values }: UpdateExpenseVariables) => {
      const formData = await buildExpenseUpdateFormData(values)
      const { data, error } = await apiClient.PATCH('/api/expenses/{id}/', {
        params: { path: { id } },
        body: formData as unknown as components['schemas']['PatchedExpenseUpdateRequest'],
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: (_data, { id, friendshipId, groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['expense', id] })
      if (friendshipId) queryClient.invalidateQueries({ queryKey: ['friendship-transactions', friendshipId] })
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ['group-transactions', groupId] })
        queryClient.invalidateQueries({ queryKey: ['group-balance', groupId] })
      }
      queryClient.invalidateQueries({ queryKey: ['user-ledgers'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      // The "My Expenses" feed includes friendship/group expenses the
      // caller has a split in, so an edit here can change it too.
      queryClient.invalidateQueries({ queryKey: ['my-expenses-summary'] })
      queryClient.invalidateQueries({ queryKey: ['my-expenses-list'] })
      queryClient.invalidateQueries({ queryKey: ['my-expenses-report'] })
      queryClient.invalidateQueries({ queryKey: ['category-budgets'] })
    },
  })
}
