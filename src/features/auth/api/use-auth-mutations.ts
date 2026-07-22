import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

export function useRequestOtpMutation() {
  return useMutation<components['schemas']['OTPRequested'], ApiError, string>({
    mutationFn: async (phoneNumber: string) => {
      const { data, error } = await apiClient.POST('/api/auth/otp/request/', {
        body: { phone_number: phoneNumber },
      })
      if (error) throw toApiError(error)
      return data
    },
  })
}

export function useVerifyOtpMutation() {
  return useMutation<
    components['schemas']['OTPVerified'],
    ApiError,
    { phoneNumber: string; code: string }
  >({
    mutationFn: async (vars) => {
      const { data, error } = await apiClient.POST('/api/auth/otp/verify/', {
        body: { phone_number: vars.phoneNumber, code: vars.code },
      })
      if (error) throw toApiError(error)
      return data
    },
  })
}

export function useUpdateProfileMutation() {
  return useMutation<components['schemas']['User'], ApiError, FormData>({
    mutationFn: async (formData: FormData) => {
      const { data, error } = await apiClient.PATCH('/api/auth/profile/', {
        // openapi-fetch's defaultBodySerializer passes FormData through
        // untouched (checked instanceof FormData) and lets the browser set
        // Content-Type + boundary itself — the typed body param just
        // expects the plain PatchedUserRequest shape, which doesn't apply
        // to a real multipart upload, hence the cast.
        body: formData as unknown as components['schemas']['PatchedUserRequest'],
      })
      if (error) throw toApiError(error)
      return data
    },
  })
}
