import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { useRouter } from '@tanstack/react-router'

/**
 * useCapacitorSetup
 *
 * Central hook for all native Capacitor platform setup.
 * Call this ONCE from __root.tsx — it covers:
 *  1. Back button (Android): wire to TanStack Router history
 *  2. App lifecycle: detect background / foreground (ready for auth lock later)
 */
export function useCapacitorSetup() {
  const router = useRouter()

  useEffect(() => {
    // Only run on real native devices — no-op in browser dev
    if (!Capacitor.isNativePlatform()) return

    const listeners: Array<Promise<{ remove: () => void }>> = []
    const platform = Capacitor.getPlatform()

    // ─── 1. Android Back Button ─────────────────────────────────────────────────
    // Without this, the back button exits the app instead of navigating back
    if (platform === 'android') {
      listeners.push(
        App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            router.history.back()
          } else {
            // At the root of the app — exit
            App.exitApp()
          }
        })
      )
    }

    // ─── 2. App Lifecycle ───────────────────────────────────────────────────────
    // Track background/foreground for future auth lock
    listeners.push(
      App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          // App moved to background
          // TODO (when backend is ready): lock app / pause sensitive operations
          console.log('[App] Moved to background')
        } else {
          // App returned to foreground
          // TODO (when backend is ready): re-validate auth token
          console.log('[App] Returned to foreground')
        }
      })
    )

    // Cleanup all listeners on unmount
    return () => {
      listeners.forEach((listenerPromise) => {
        listenerPromise.then((listener) => listener.remove())
      })
    }
  }, [router])
}
