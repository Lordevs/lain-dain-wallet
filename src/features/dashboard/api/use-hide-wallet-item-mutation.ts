import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError, type ApiError } from '@/lib/api/errors'

interface HideWalletItemInput {
  rowType: 'person' | 'group'
  targetId: string
}

export function useHideWalletItemMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, HideWalletItemInput>({
    mutationFn: async ({ rowType, targetId }) => {
      const { error } = await apiClient.POST('/api/expenses/wallet/hide/', {
        body: { row_type: rowType, target_id: targetId },
      })
      if (error) throw toApiError(error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}
