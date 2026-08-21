import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { upsertSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import { useAuthStore } from '@/store/use-auth-store'

export interface UpdateGroupValues {
  name?: string
  description?: string
  /** Local object: / blob: URL — will be fetched into a real Blob before upload */
  image?: string | null
  smart_settle_enabled?: boolean
}

/** PATCH /api/ledger/groups/{id}/ — admin-only.
 * Accepts name / description / image (file) / smart_settle_enabled.
 * On success the ['group', id] cache entry is invalidated so every screen
 * reading useGroupQuery refetches automatically. */
export function useUpdateGroupMutation(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['GroupUpdate'], ApiError, UpdateGroupValues, { previousGroup?: components['schemas']['Group'] }>({
    mutationFn: async (values: UpdateGroupValues) => {
      const fields: Array<[string, string]> = []
      if (values.name !== undefined) fields.push(['name', values.name])
      if (values.description !== undefined) fields.push(['description', values.description])
      if (values.smart_settle_enabled !== undefined) {
        fields.push(['smart_settle_enabled', String(values.smart_settle_enabled)])
      }
      if (values.image === null) fields.push(['remove_image', 'true'])
      const current = queryClient.getQueryData<components['schemas']['Group']>(['group', groupId])
      const optimistic = { ...current, ...values, id: groupId } as components['schemas']['GroupUpdate']
      const result = await queueMutation({
        resource: 'group', method: 'PATCH', path: `/api/ledger/groups/${groupId}/`,
        multipart: {
          fields,
          file: typeof values.image === 'string' ? {
            field: 'image', sourceUri: values.image, filename: 'group-image.jpg', mimeType: 'image/jpeg',
          } : undefined,
        },
        optimisticResult: optimistic,
      })
      const ownerId = useAuthStore.getState().userProfile?.id
      if (ownerId) await upsertSnapshotRecord(ownerId, 'groups', { id: groupId, data: result.data })
      return result.data
    },
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: ['group', groupId] })
      const previousGroup = queryClient.getQueryData<components['schemas']['Group']>(['group', groupId])
      if (previousGroup && values.smart_settle_enabled !== undefined) {
        queryClient.setQueryData<components['schemas']['Group']>(['group', groupId], {
          ...previousGroup,
          smart_settle_enabled: values.smart_settle_enabled,
        })
      }
      return { previousGroup }
    },
    onSuccess: (updatedGroup) => {
      queryClient.setQueryData(['group', groupId], updatedGroup)
      queryClient.invalidateQueries({ queryKey: ['group-balance', groupId] })
    },
    onError: (_error, _values, context) => {
      if (context?.previousGroup) {
        queryClient.setQueryData(['group', groupId], context.previousGroup)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['group', groupId] }),
  })
}
