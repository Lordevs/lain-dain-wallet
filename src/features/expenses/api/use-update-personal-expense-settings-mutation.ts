import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { getSnapshotRecord, upsertSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import { useAuthStore } from '@/store/use-auth-store'

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
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!ownerId) throw new ApiError('Sign in before updating expense settings.')
      const current = queryClient.getQueryData<PersonalExpenseSettings>(['personal-expense-settings'])
        ?? await getSnapshotRecord<PersonalExpenseSettings>(ownerId, 'personal-settings', ownerId)
      if (!current) throw new ApiError('Open expense settings online once before changing them offline.')
      const result = await queueMutation({
        resource: 'personal-settings', method: 'PATCH', path: '/api/expenses/my-expenses/settings/',
        body: values, optimisticResult: { ...current, ...values } as PersonalExpenseSettings,
      })
      await upsertSnapshotRecord(ownerId, 'personal-settings', { id: ownerId, data: result.data })
      return result.data
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
