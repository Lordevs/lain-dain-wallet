import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { appendSettlementFields, type SettlementCoreValues } from '../lib/append-settlement-fields'

export interface GroupSettlementEntry {
  user_id: string
  amount: string
}

export interface GroupSettlementFormValues extends SettlementCoreValues {
  /** One entry per member in this batch — a single-person settle-up is
   * just a one-item list. */
  entries: GroupSettlementEntry[]
}

/** POST /api/expenses/groups/{group_id}/settlements/ — a single Confirm
 * tap can pay/receive from several members at once. `entries` travels as
 * a JSON-encoded string (multipart has no native nested-array wire
 * format), same convention as ExpenseCreateSerializer's payers/splits. */
export function useCreateGroupSettlementMutation(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation<unknown, ApiError, GroupSettlementFormValues>({
    mutationFn: async (values) => {
      const formData = new FormData()
      formData.append('entries', JSON.stringify(values.entries))
      await appendSettlementFields(formData, values)

      const { data, error } = await apiClient.POST('/api/expenses/groups/{group_id}/settlements/', {
        params: { path: { group_id: groupId } },
        body: formData as unknown as components['schemas']['GroupSettlementCreateRequest'],
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-transactions', groupId] })
      queryClient.invalidateQueries({ queryKey: ['group-balance', groupId] })
      queryClient.invalidateQueries({ queryKey: ['user-ledgers'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}
