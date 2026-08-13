import { SecureStorage } from '@aparajita/capacitor-secure-storage'

// Refresh-token persistence only — the access token never touches disk,
// it lives in memory (see store/use-auth-store.ts) and is re-derived from
// the refresh token on cold start. Backed by iOS Keychain / Android
// Keystore on native; the plugin falls back to its own (unencrypted) web
// storage in the browser, which is fine for local dev and never reached
// in a real deployed build (the app only ships as a Capacitor native app).
const REFRESH_TOKEN_KEY = 'refresh_token'
const DEVICE_ID_KEY = 'device_id'

export async function getRefreshToken(): Promise<string | null> {
  try {
    const value = await SecureStorage.getItem(REFRESH_TOKEN_KEY)
    return typeof value === 'string' ? value : null
  } catch {
    return null
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  await SecureStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export async function clearRefreshToken(): Promise<void> {
  try {
    await SecureStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    // Nothing was stored — fine, logout should never fail because of this.
  }
}

export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const existing = await SecureStorage.getItem(DEVICE_ID_KEY)
    if (typeof existing === 'string' && existing) return existing
  } catch {
    // Continue and create the installation identity below.
  }

  const deviceId = crypto.randomUUID()
  await SecureStorage.setItem(DEVICE_ID_KEY, deviceId)
  return deviceId
}
