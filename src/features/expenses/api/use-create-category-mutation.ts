import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

interface CreateCategoryVariables {
  name: string
  icon: string
  color: string
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['Category'], ApiError, CreateCategoryVariables>({
    mutationFn: async (vars: CreateCategoryVariables) => {
      const { data, error } = await apiClient.POST('/api/expenses/categories/', { body: vars })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
