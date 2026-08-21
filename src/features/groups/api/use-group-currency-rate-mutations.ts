import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { getSnapshotRecord, upsertSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import { useAuthStore } from '@/store/use-auth-store'

type Group = components['schemas']['Group']

export function useSetGroupCurrencyRateMutation(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation<Group, ApiError, { currency: string; rate: string }>({
    mutationFn: async ({ currency, rate }) => {
      const ownerId = useAuthStore.getState().userProfile?.id
      const current = queryClient.getQueryData<Group>(['group', groupId])
        ?? (ownerId ? await getSnapshotRecord<Group>(ownerId, 'groups', groupId) : null)
      if (!current) throw new ApiError('Open this group online once before changing its currency offline.')
      const result = await queueMutation({
        resource: 'groups', method: 'POST', path: `/api/ledger/groups/${groupId}/currency-rates/`,
        body: { currency: currency.toUpperCase(), rate }, optimisticResult: current,
      })
      if (ownerId) await upsertSnapshotRecord(ownerId, 'groups', { id: groupId, data: result.data })
      return result.data
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
      const ownerId = useAuthStore.getState().userProfile?.id
      const current = queryClient.getQueryData<Group>(['group', groupId])
        ?? (ownerId ? await getSnapshotRecord<Group>(ownerId, 'groups', groupId) : null)
      if (!current) throw new ApiError('Open this group online once before changing its currency offline.')
      const result = await queueMutation({
        resource: 'groups', method: 'DELETE',
        path: `/api/ledger/groups/${groupId}/currency-rates/${currency.toUpperCase()}/`,
        optimisticResult: current,
      })
      if (ownerId) await upsertSnapshotRecord(ownerId, 'groups', { id: groupId, data: result.data })
      return result.data
    },
    onSuccess: (group) => {
      queryClient.setQueryData(['group', groupId], group)
      toast.success('Currency removed')
    },
    onError: (error) => toast.error(error.message),
  })
}
