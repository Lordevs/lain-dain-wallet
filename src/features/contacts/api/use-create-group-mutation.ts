import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

interface CreateGroupVariables {
  name: string
  description: string
  defaultCurrency: string
  category: string
  memberIds: string[]
  image: string | null
  currencyRates: Record<string, string>
}

async function buildGroupFormData(vars: CreateGroupVariables): Promise<FormData> {
  const formData = new FormData()
  formData.append('name', vars.name)
  if (vars.description) formData.append('description', vars.description)
  formData.append('default_currency', vars.defaultCurrency)
  formData.append('category', vars.category)
  // A repeated form key is how multipart/form-data natively encodes a list —
  // DRF's ListField reads it the same way it would repeated query params,
  // unlike a JSON-object field (see GroupSerializer.currency_rate_inputs'
  // docstring for why THAT one has to be a JSON string instead).
  for (const id of vars.memberIds) formData.append('member_ids', id)
  if (Object.keys(vars.currencyRates).length > 0) {
    formData.append('currency_rate_inputs', JSON.stringify(vars.currencyRates))
  }
  if (vars.image) {
    const blob = await fetch(vars.image).then((res) => res.blob())
    formData.append('image', blob, 'group.jpg')
  }
  return formData
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation<components['schemas']['Group'], ApiError, CreateGroupVariables>({
    mutationFn: async (vars: CreateGroupVariables) => {
      const formData = await buildGroupFormData(vars)
      const { data, error } = await apiClient.POST('/api/ledger/groups/', {
        body: formData as unknown as components['schemas']['GroupRequest'],
      })
      if (error) throw toApiError(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}
