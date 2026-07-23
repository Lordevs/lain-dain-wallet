import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

export function useReportIssueMutation() {
  return useMutation<components['schemas']['IssueReport'], ApiError, FormData>({
    mutationFn: async (formData: FormData) => {
      const { data, error } = await apiClient.POST('/api/support/issues/', {
        // Same FormData-passthrough cast as useUpdateProfileMutation — see
        // that hook's comment for why openapi-fetch is fine with this.
        body: formData as unknown as components['schemas']['IssueReportRequest'],
      })
      if (error) throw toApiError(error)
      return data
    },
  })
}
