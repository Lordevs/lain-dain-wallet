import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { useAuthStore } from '@/store/use-auth-store'
import { expenseUpdateFields, type ExpenseUpdateFormValues } from '../lib/build-expense-update-form-data'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { getLocalExpense, markLocalExpenseSynced, updateLocalExpenseSnapshot } from '@/lib/sqlite/expenses-store'

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

  return useMutation<components['schemas']['ExpenseRead'], ApiError, UpdateExpenseVariables>({
    mutationFn: async ({ id, values }: UpdateExpenseVariables) => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!ownerId) throw new ApiError('Sign in before editing an expense.')
      const current = queryClient.getQueryData<components['schemas']['ExpenseRead']>(['expense', id])
        ?? await getLocalExpense(ownerId, id)
      if (!current) throw new ApiError('Open this expense online once before editing it offline.')
      const category = queryClient.getQueryData<components['schemas']['Category'][]>(['categories'])
        ?.find((item) => item.id === values.categoryId) ?? current.category
      const optimistic = {
        ...current, description: values.description, amount: values.amount, date: values.date,
        category, note: values.note ?? '', split_type: values.splitType,
        receipt: values.removeReceipt ? null : (values.receipt ?? current.receipt),
        payers: values.payers.map((payer) => ({
          ...(current.payers.find((item) => item.id === payer.user_id) ?? { id: payer.user_id, full_name: 'Member', phone_number: '', image: null }),
          amount: payer.amount,
        })),
        splits: values.splits.map((split) => ({
          ...(current.splits.find((item) => item.id === split.user_id) ?? { id: split.user_id, full_name: 'Member', phone_number: '', image: null }),
          amount_owed: 'amount_owed' in split ? (split.amount_owed ?? '0.00') : '0.00',
          extra_amount: 'extra_amount' in split ? (split.extra_amount ?? '0.00') : '0.00',
        })),
      } as components['schemas']['ExpenseRead']
      const result = await queueMutation({
        resource: 'expenses', method: 'PATCH', path: `/api/expenses/${id}/`,
        multipart: {
          fields: expenseUpdateFields(values),
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
    onSuccess: (_data, { id, values, friendshipId, groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['expense', id] })
      if (friendshipId) queryClient.invalidateQueries({ queryKey: ['friendship-transactions', friendshipId] })
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ['group-transactions', groupId] })
        queryClient.invalidateQueries({ queryKey: ['group-balance', groupId] })
        queryClient.invalidateQueries({ queryKey: ['group-used-categories', groupId] })
      }
      // The full participant list is right here in the form values that
      // were just submitted (works uniformly for friendship or group
      // context) — scope to exactly those other participants instead of
      // invalidating every cached combined ledger view.
      const myId = useAuthStore.getState().userProfile?.id
      for (const split of values.splits) {
        if (split.user_id !== myId) {
          queryClient.invalidateQueries({ queryKey: ['user-ledgers', split.user_id] })
        }
      }
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
