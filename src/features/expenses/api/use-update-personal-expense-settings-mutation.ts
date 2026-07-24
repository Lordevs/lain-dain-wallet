import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

type PersonalExpenseSettingsUpdate = components['schemas']['PatchedPersonalExpenseSettingsUpdateRequest']
type PersonalExpenseSettings = components['schemas']['PersonalExpenseSettings']

/** PATCH /api/expenses/my-expenses/settings/ — every field optional, only
 * whatever's provided gets touched (see services.update_personal_expense_
 * settings). Used by the settings/hide-ledgers/default-period/budget-limit
 * screens, each of which only ever sends the field(s) it owns. */
export function useUpdatePersonalExpenseSettingsMutation() {
  const queryClient = useQueryClient()

  return useMutation<PersonalExpenseSettings, ApiError, PersonalExpenseSettingsUpdate>({
    mutationFn: async (values) => {
      const { data, error } = await apiClient.PATCH('/api/expenses/my-expenses/settings/', {
        body: values,
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['personal-expense-settings'], data)
      // period_start_day/hidden_*_ids changes shift which expenses fall
      // into "this period" or count toward My Expenses at all.
      queryClient.invalidateQueries({ queryKey: ['my-expenses-summary'] })
      queryClient.invalidateQueries({ queryKey: ['my-expenses-list'] })
      queryClient.invalidateQueries({ queryKey: ['my-expenses-report'] })
      queryClient.invalidateQueries({ queryKey: ['category-budgets'] })
    },
  })
}
