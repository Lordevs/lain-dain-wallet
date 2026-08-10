import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Keyboard } from '@capacitor/keyboard'
import { useRouter } from '@tanstack/react-router'

/**
 * useCapacitorSetup
 *
 * Central hook for all native Capacitor platform setup.
 * Call this ONCE from __root.tsx — it covers:
 *  1. Keyboard: sync height to --keyboard-height CSS var so drawers/sheets can respond
 *  2. Back button (Android): wire to TanStack Router history
 *  3. App lifecycle: detect background / foreground (ready for auth lock later)
 */
export function useCapacitorSetup() {
  const router = useRouter()

  useEffect(() => {
    // Only run on real native devices — no-op in browser dev
    if (!Capacitor.isNativePlatform()) return

    const listeners: Array<Promise<{ remove: () => void }>> = []

    // ─── 1. Keyboard ───────────────────────────────────────────────────────────
    const resetKeyboardState = () => {
      document.documentElement.style.setProperty('--keyboard-height', '0px')
      document.body.classList.remove('keyboard-open')
    }

    // Keep the keyboard height available to components that need it without
    // resizing document.body. WKWebView itself is resized natively on iOS.
    listeners.push(
      Keyboard.addListener('keyboardWillShow', (info) => {
        document.body.classList.add('keyboard-open')
        document.documentElement.style.setProperty(
          '--keyboard-height',
          `${info.keyboardHeight}px`
        )

        requestAnimationFrame(() => {
          const activeElement = document.activeElement
          if (activeElement instanceof HTMLElement) {
            activeElement.scrollIntoView({ block: 'nearest', inline: 'nearest' })
          }
        })
      })
    )

    listeners.push(
      Keyboard.addListener('keyboardWillHide', resetKeyboardState)
    )

    // didHide is the authoritative end of the native animation. Keeping both
    // events covers cancelled/interactive keyboard dismissals on iOS.
    listeners.push(
      Keyboard.addListener('keyboardDidHide', resetKeyboardState)
    )

    // ─── 2. Android Back Button ─────────────────────────────────────────────────
    // Without this, the back button exits the app instead of navigating back
    if (Capacitor.getPlatform() === 'android') {
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

    // ─── 3. App Lifecycle ───────────────────────────────────────────────────────
    // Track background/foreground for future auth lock
    listeners.push(
      App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          // App moved to background
          // TODO (when backend is ready): lock app / pause sensitive operations
          console.log('[App] Moved to background')
        } else {
          resetKeyboardState()
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
