import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { buildPersonalExpenseFormData, type PersonalExpenseFormValues } from '../lib/build-personal-expense-form-data'

export function useCreatePersonalExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['PersonalExpenseCreate'], ApiError, PersonalExpenseFormValues>({
    mutationFn: async (values) => {
      const formData = await buildPersonalExpenseFormData(values)
      const { data, error } = await apiClient.POST('/api/expenses/personal/', {
        body: formData as unknown as components['schemas']['PersonalExpenseCreateRequest'],
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-expenses-summary'] })
      queryClient.invalidateQueries({ queryKey: ['my-expenses-list'] })
      queryClient.invalidateQueries({ queryKey: ['my-expenses-report'] })
      queryClient.invalidateQueries({ queryKey: ['category-budgets'] })
    },
  })
}
