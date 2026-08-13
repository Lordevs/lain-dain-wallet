import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { Capacitor } from '@capacitor/core'
import { getOrCreateDeviceId } from '@/lib/secure-storage'

export class ActiveDeviceSessionError extends ApiError {
  activeDeviceName: string
  takeoverToken: string

  constructor(activeDeviceName: string, takeoverToken: string) {
    super(`This account is currently active on ${activeDeviceName}.`)
    this.name = 'ActiveDeviceSessionError'
    this.activeDeviceName = activeDeviceName
    this.takeoverToken = takeoverToken
  }
}

function getDeviceLabel(platform: string): string {
  if (platform === 'ios') return 'iPhone or iPad'
  if (platform === 'android') return 'Android device'
  return 'Web browser'
}

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
      const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web'
      const { data, error, response } = await apiClient.POST('/api/auth/otp/verify/', {
        body: {
          phone_number: vars.phoneNumber,
          code: vars.code,
          device_id: await getOrCreateDeviceId(),
          device_name: getDeviceLabel(platform),
          platform,
        },
      })
      if (error) {
        const conflict = error as unknown as {
          code?: string
          active_device_name?: string
          takeover_token?: string
        }
        if (
          response.status === 409 &&
          conflict.code === 'active_device_session' &&
          conflict.takeover_token
        ) {
          throw new ActiveDeviceSessionError(
            conflict.active_device_name || 'another device',
            conflict.takeover_token,
          )
        }
        throw toApiError(error)
      }
      return data
    },
  })
}

export function useTakeoverMutation() {
  return useMutation<components['schemas']['OTPVerified'], ApiError, string>({
    mutationFn: async (takeoverToken) => {
      const { data, error } = await apiClient.POST('/api/auth/otp/takeover/', {
        body: { takeover_token: takeoverToken },
      })
      if (error) throw toApiError(error)
      return data
    },
  })
}

export function useLogoutMutation() {
  return useMutation<void, ApiError, string>({
    mutationFn: async (refreshToken: string) => {
      const { error } = await apiClient.POST('/api/auth/logout/', {
        body: { refresh: refreshToken },
      })
      if (error) throw toApiError(error)
    },
  })
}

export function useDeleteAccountMutation() {
  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      const { error } = await apiClient.POST('/api/auth/profile/delete/')
      if (error) throw toApiError(error)
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
