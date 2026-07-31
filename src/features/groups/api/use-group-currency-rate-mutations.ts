import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

type Group = components['schemas']['Group']

export function useSetGroupCurrencyRateMutation(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation<Group, ApiError, { currency: string; rate: string }>({
    mutationFn: async ({ currency, rate }) => {
      const { data, error } = await apiClient.POST('/api/ledger/groups/{group_id}/currency-rates/', {
        params: { path: { group_id: groupId } },
        body: { currency: currency.toUpperCase(), rate },
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: (group) => {
      queryClient.setQueryData(['group', groupId], group)
      toast.success('Exchange rate saved')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useRemoveGroupCurrencyRateMutation(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation<Group, ApiError, string>({
    mutationFn: async (currency) => {
      const { data, error } = await apiClient.DELETE(
        '/api/ledger/groups/{group_id}/currency-rates/{currency}/',
        {
          params: {
            path: { group_id: groupId, currency: currency.toUpperCase() },
          },
        },
      )
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: (group) => {
      queryClient.setQueryData(['group', groupId], group)
      toast.success('Currency removed')
    },
    onError: (error) => toast.error(error.message),
  })
}
