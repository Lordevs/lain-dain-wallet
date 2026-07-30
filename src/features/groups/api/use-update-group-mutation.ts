import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

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

  return useMutation<components['schemas']['GroupUpdate'], ApiError, UpdateGroupValues>({
    mutationFn: async (values: UpdateGroupValues) => {
      const formData = new FormData()

      if (values.name !== undefined) formData.append('name', values.name)
      if (values.description !== undefined) formData.append('description', values.description)
      if (values.smart_settle_enabled !== undefined) {
        formData.append('smart_settle_enabled', String(values.smart_settle_enabled))
      }

      if (values.image !== undefined) {
        if (values.image === null) {
          formData.append('image', '')
        } else {
          const blob = await fetch(values.image).then((r) => r.blob())
          const ext = blob.type.split('/')[1] || 'jpg'
          formData.append('image', blob, `group-image.${ext}`)
        }
      }

      const { data, error } = await apiClient.PATCH('/api/ledger/groups/{id}/', {
        params: { path: { id: groupId } },
        body: formData as unknown as components['schemas']['PatchedGroupUpdateRequest'],
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      queryClient.invalidateQueries({ queryKey: ['group-balance', groupId] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
