import { Preferences } from '@capacitor/preferences'
import type { UserProfile } from '@/store/use-auth-store'

const KEY = 'lain-dain-offline-profile'

export async function cacheOfflineProfile(profile: UserProfile): Promise<void> {
  await Preferences.set({ key: KEY, value: JSON.stringify(profile) })
}

export async function getCachedOfflineProfile(): Promise<UserProfile | null> {
  const { value } = await Preferences.get({ key: KEY })
  if (!value) return null
  try {
    return JSON.parse(value) as UserProfile
  } catch {
    await Preferences.remove({ key: KEY })
    return null
  }
}

export async function clearCachedOfflineProfile(): Promise<void> {
  await Preferences.remove({ key: KEY })
}
