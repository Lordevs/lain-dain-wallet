import { apiClient, refreshAccessToken } from './client'
import { mapUserToProfile } from '@/features/auth/api/map-user'
import { useAuthStore } from '@/store/use-auth-store'

/**
 * Cold-start session restore — the access token lives in memory only (see
 * store/use-auth-store.ts), so every fresh launch starts with none. This
 * re-derives one from the refresh token sitting in secure storage (if any)
 * and re-fetches the profile, so __root.tsx's route guard sees accurate
 * isAuthenticated/profileComplete state on the very first navigation.
 * Must be awaited before the router renders (see main.tsx) — the guard
 * reads store state synchronously and has no way to wait for this itself.
 * Fails silently: no refresh token, an expired one, or a network error at
 * launch all just mean "start logged out," never a crash.
 */
export async function bootstrapAuth(): Promise<void> {
  const accessToken = await refreshAccessToken()
  if (!accessToken) return

  const { data, error } = await apiClient.GET('/api/auth/profile/')
  if (error || !data) return

  const profile = mapUserToProfile(data)
  useAuthStore.getState().setProfile(profile)
  useAuthStore.getState().setIsAuthenticated(true)
}
