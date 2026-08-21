import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { ApiError, toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { Capacitor } from '@capacitor/core'
import { getOrCreateDeviceId } from '@/lib/secure-storage'
import type { ProfileFormData } from '@/features/auth/components/profile-form'
import { profileFields } from '@/features/auth/api/build-profile-form-data'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { upsertSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import { useAuthStore } from '@/store/use-auth-store'
import { COUNTRY_NAME_TO_CODE } from '@/features/auth/api/country-codes'

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
  return useMutation<components['schemas']['User'], ApiError, Partial<ProfileFormData>>({
    mutationFn: async (values) => {
      const current = useAuthStore.getState().userProfile
      if (!current?.id) throw new ApiError('Sign in before updating your profile.')
      const optimisticUser = {
        id: current.id,
        phone_number: current.phone,
        full_name: values.fullName ?? current.name ?? '',
        date_of_birth: values.dateOfBirth ?? current.dateOfBirth ?? null,
        gender: (values.gender?.toLowerCase() ?? current.gender ?? '') as components['schemas']['GenderEnum'],
        country: values.country
          ? (COUNTRY_NAME_TO_CODE[values.country] ?? values.country)
          : (current.country ?? ''),
        email: values.email ?? current.email ?? null,
        occupation: values.occupation ?? current.occupation ?? '',
        image: values.avatar ?? current.avatar ?? null,
        profile_complete: true,
        default_currency: current.defaultCurrency,
      } as components['schemas']['User']
      const result = await queueMutation({
        resource: 'profile', method: 'PATCH', path: '/api/auth/profile/',
        multipart: {
          fields: profileFields(values),
          file: values.avatar ? {
            field: 'image', sourceUri: values.avatar, filename: 'avatar.jpg', mimeType: 'image/jpeg',
          } : undefined,
        },
        optimisticResult: optimisticUser,
      })
      await upsertSnapshotRecord(current.id, 'profile', { id: current.id, data: result.data })
      return result.data
    },
  })
}
