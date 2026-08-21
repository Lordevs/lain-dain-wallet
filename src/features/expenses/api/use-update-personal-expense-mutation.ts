import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import {
  personalExpenseUpdateFields,
  type PersonalExpenseUpdateFormValues,
} from '../lib/build-personal-expense-update-form-data'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { getLocalExpense, markLocalExpenseSynced, updateLocalExpenseSnapshot } from '@/lib/sqlite/expenses-store'
import { useAuthStore } from '@/store/use-auth-store'

interface UpdatePersonalExpenseVariables {
  id: string
  values: PersonalExpenseUpdateFormValues
}

export function useUpdatePersonalExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['ExpenseRead'], ApiError, UpdatePersonalExpenseVariables>({
    mutationFn: async ({ id, values }) => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!ownerId) throw new ApiError('Sign in before editing an expense.')
      const current = queryClient.getQueryData<components['schemas']['ExpenseRead']>(['expense', id])
        ?? await getLocalExpense(ownerId, id)
      if (!current) throw new ApiError('Open this expense online once before editing it offline.')
      const category = queryClient.getQueryData<components['schemas']['Category'][]>(['categories'])
        ?.find((item) => item.id === values.categoryId) ?? current.category
      const optimistic = {
        ...current, description: values.description, amount: values.amount, date: values.date,
        category, note: values.note ?? '', receipt: values.removeReceipt ? null : (values.receipt ?? current.receipt),
      }
      const result = await queueMutation({
        resource: 'expenses', method: 'PATCH', path: `/api/expenses/${id}/`,
        multipart: {
          fields: personalExpenseUpdateFields(values),
          file: !values.removeReceipt && values.receipt ? {
            field: 'receipt', sourceUri: values.receipt, filename: 'receipt.jpg', mimeType: 'image/jpeg',
          } : undefined,
        },
        optimisticResult: optimistic,
      })
      if (result.synced) {
        await markLocalExpenseSynced(id, result.data.currency, result.data.receipt ?? null, result.data)
      } else {
        await updateLocalExpenseSnapshot(ownerId, result.data)
      }
      queryClient.setQueryData(['expense', id], result.data)
      return result.data
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
