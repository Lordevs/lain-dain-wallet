import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { buildExpenseUpdateFormData, type ExpenseUpdateFormValues } from '../lib/build-expense-update-form-data'

interface UpdateExpenseVariables {
  id: string
  values: ExpenseUpdateFormValues
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
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['expense', id] })
      queryClient.invalidateQueries({ queryKey: ['friendship-transactions'] })
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
