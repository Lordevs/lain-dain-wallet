import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { useAuthStore } from '@/store/use-auth-store'
import {
  buildFriendshipExpenseFormData,
  type FriendshipExpenseFormValues as LedgerExpenseFormValues,
} from '@/features/contacts/lib/build-friendship-expense-form-data'

interface CreateGroupExpenseVariables {
  groupId: string
  values: LedgerExpenseFormValues
}

/** POST /api/expenses/groups/{group_id}/ — same ExpenseCreateSerializer
 * shape as the friendship version, just against N members instead of 2,
 * so it reuses buildFriendshipExpenseFormData as-is. */
export function useCreateGroupExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['ExpenseCreate'], ApiError, CreateGroupExpenseVariables>({
    mutationFn: async ({ groupId, values }: CreateGroupExpenseVariables) => {
      const formData = await buildFriendshipExpenseFormData(values)
      const { data, error } = await apiClient.POST('/api/expenses/groups/{group_id}/', {
        params: { path: { group_id: groupId } },
        body: formData as unknown as components['schemas']['ExpenseCreateRequest'],
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: (_data, { groupId, values }) => {
      queryClient.invalidateQueries({ queryKey: ['group-transactions', groupId] })
      queryClient.invalidateQueries({ queryKey: ['group-balance', groupId] })
      // The full participant list is right here in the form values that
      // were just submitted — scope to exactly those other members
      // instead of invalidating every cached combined ledger view.
      const myId = useAuthStore.getState().userProfile?.id
      for (const split of values.splits) {
        if (split.user_id !== myId) {
          queryClient.invalidateQueries({ queryKey: ['user-ledgers', split.user_id] })
        }
      }
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}
