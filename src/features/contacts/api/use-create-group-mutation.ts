import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { upsertSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import { useAuthStore } from '@/store/use-auth-store'

interface CreateGroupVariables {
  name: string
  description: string
  defaultCurrency: string
  category: string
  memberIds: string[]
  image: string | null
  currencyRates: Record<string, string>
}

function groupFields(vars: CreateGroupVariables, id: string): Array<[string, string]> {
  const fields: Array<[string, string]> = [
    ['id', id],
    ['name', vars.name],
    ['default_currency', vars.defaultCurrency],
    ['category', vars.category],
  ]
  if (vars.description) fields.push(['description', vars.description])
  // A repeated form key is how multipart/form-data natively encodes a list —
  // DRF's ListField reads it the same way it would repeated query params,
  // unlike a JSON-object field (see GroupSerializer.currency_rate_inputs'
  // docstring for why THAT one has to be a JSON string instead).
  for (const memberId of vars.memberIds) fields.push(['member_ids', memberId])
  if (Object.keys(vars.currencyRates).length > 0) {
    fields.push(['currency_rate_inputs', JSON.stringify(vars.currencyRates)])
  }
  return fields
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['Group'], ApiError, CreateGroupVariables>({
    mutationFn: async (vars: CreateGroupVariables) => {
      const id = crypto.randomUUID()
      const optimisticGroup = {
        id,
        name: vars.name,
        description: vars.description,
        image: vars.image,
        default_currency: vars.defaultCurrency,
        category: vars.category,
        smart_settle_enabled: false,
        members: [],
        currency_rates: [],
      } as unknown as components['schemas']['Group']
      const result = await queueMutation({
        resource: 'group', method: 'POST', path: '/api/ledger/groups/',
        multipart: {
          fields: groupFields(vars, id),
          file: vars.image ? {
            field: 'image', sourceUri: vars.image, filename: 'group.jpg', mimeType: 'image/jpeg',
          } : undefined,
        },
        optimisticResult: optimisticGroup,
      })
      const ownerId = useAuthStore.getState().userProfile?.id
      if (ownerId) await upsertSnapshotRecord(ownerId, 'groups', { id, data: result.data })
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}
