import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { upsertSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import { useAuthStore } from '@/store/use-auth-store'

interface CreateCategoryVariables {
  name: string
  icon: string
  color: string
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['Category'], ApiError, CreateCategoryVariables>({
    mutationFn: async (vars: CreateCategoryVariables) => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!ownerId) throw new ApiError('Sign in before creating a category.')
      const normalizedName = vars.name.trim().toLocaleLowerCase()
      const existing = queryClient.getQueryData<components['schemas']['Category'][]>(['categories'])
        ?.find((category) => category.name.trim().toLocaleLowerCase() === normalizedName)
      // Category names are unique for a user. Returning the local match keeps
      // a double-tap (or a stale open form) from adding a doomed outbox row.
      if (existing) return existing
      const id = crypto.randomUUID()
      const optimistic = {
        id, ...vars, is_system: false, owner: ownerId, created_at: new Date().toISOString(),
      } as components['schemas']['Category']
      const result = await queueMutation({
        resource: 'categories', method: 'POST', path: '/api/expenses/categories/',
        body: { id, ...vars }, optimisticResult: optimistic,
      })
      await upsertSnapshotRecord(ownerId, 'categories', { id, data: result.data })
      queryClient.setQueryData<components['schemas']['Category'][]>(['categories'], (old = []) => (
        old.some((category) => category.id === result.data.id) ? old : [...old, result.data]
      ))
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
