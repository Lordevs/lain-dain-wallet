import { Preferences } from '@capacitor/preferences'
import type { AsyncStorage } from '@tanstack/query-persist-client-core'

/**
 * Adapts @capacitor/preferences to the AsyncStorage shape
 * createAsyncStoragePersister expects — see src/lib/api/query-client.ts.
 * Preferences is unencrypted (UserDefaults/SharedPreferences on native,
 * localStorage on web), which is exactly right for a query cache: it's
 * non-sensitive, disposable, and safe to lose. Auth tokens never go
 * through here — see src/lib/secure-storage.ts for those.
 */
export const preferencesStorage: AsyncStorage<string> = {
  async getItem(key) {
    const { value } = await Preferences.get({ key })
    return value
  },
  async setItem(key, value) {
    await Preferences.set({ key, value })
  },
  async removeItem(key) {
    await Preferences.remove({ key })
  },
}
