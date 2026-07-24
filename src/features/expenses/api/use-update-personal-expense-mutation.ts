import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import {
  buildPersonalExpenseUpdateFormData,
  type PersonalExpenseUpdateFormValues,
} from '../lib/build-personal-expense-update-form-data'

interface UpdatePersonalExpenseVariables {
  id: string
  values: PersonalExpenseUpdateFormValues
}

export function useUpdatePersonalExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['ExpenseUpdate'], ApiError, UpdatePersonalExpenseVariables>({
    mutationFn: async ({ id, values }) => {
      const formData = await buildPersonalExpenseUpdateFormData(values)
      const { data, error } = await apiClient.PATCH('/api/expenses/{id}/', {
        params: { path: { id } },
        body: formData as unknown as components['schemas']['PatchedExpenseUpdateRequest'],
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['expense', id] })
      queryClient.invalidateQueries({ queryKey: ['my-expenses-summary'] })
      queryClient.invalidateQueries({ queryKey: ['my-expenses-list'] })
      queryClient.invalidateQueries({ queryKey: ['my-expenses-report'] })
      queryClient.invalidateQueries({ queryKey: ['category-budgets'] })
    },
  })
}
