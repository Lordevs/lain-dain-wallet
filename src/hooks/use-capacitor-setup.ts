import { useCallback, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { useRouter } from '@tanstack/react-router'
import { parentPath } from '@/lib/navigation-hierarchy'

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

  const navigateToParent = useCallback(() => {
    const parent = parentPath(router.state.location.pathname)
    if (!parent) return false
    void router.navigate({ to: parent, replace: true } as never)
    return true
  }, [router])

  useEffect(() => {
    // iOS WKWebView's dynamic viewport units can briefly report the layout
    // viewport while a native picker/keyboard is animating. Keep an exact
    // visual-viewport height available to sheets so they resize without
    // pushing or stretching the routed screen behind them.
    const viewport = window.visualViewport
    const updateViewportHeight = () => {
      const viewportHeight = viewport?.height ?? window.innerHeight
      const viewportOffsetTop = viewport?.offsetTop ?? 0
      const keyboardInset = Math.max(0, window.innerHeight - viewportHeight - viewportOffsetTop)
      document.documentElement.style.setProperty(
        '--app-viewport-height',
        `${viewportHeight}px`,
      )
      document.documentElement.style.setProperty('--keyboard-inset', `${keyboardInset}px`)
    }
    updateViewportHeight()
    viewport?.addEventListener('resize', updateViewportHeight)
    viewport?.addEventListener('scroll', updateViewportHeight)
    window.addEventListener('orientationchange', updateViewportHeight)
    const platform = Capacitor.getPlatform()

    // Edge swipe works independently of the OS navigation-bar mode. Android
    // accepts an inward swipe from either edge; iOS uses the familiar left
    // edge. Vertical scrolling and controls are deliberately ignored.
    let startX = 0
    let startY = 0
    let trackingEdgeSwipe = false
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      const target = event.target as HTMLElement | null
      if (!touch || target?.closest('input, textarea, select, [data-vaul-drawer]')) return
      const fromLeft = touch.clientX <= 24
      const fromRight = platform === 'android' && touch.clientX >= window.innerWidth - 24
      trackingEdgeSwipe = fromLeft || fromRight
      startX = touch.clientX
      startY = touch.clientY
    }
    const onTouchEnd = (event: TouchEvent) => {
      if (!trackingEdgeSwipe) return
      trackingEdgeSwipe = false
      const touch = event.changedTouches[0]
      if (!touch) return
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      const inwardDistance = startX <= 24 ? dx : -dx
      if (inwardDistance >= 72 && Math.abs(dx) > Math.abs(dy) * 1.4) navigateToParent()
    }
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })

    // Only run on real native devices — no-op in browser dev
    if (!Capacitor.isNativePlatform()) {
      return () => {
        viewport?.removeEventListener('resize', updateViewportHeight)
        viewport?.removeEventListener('scroll', updateViewportHeight)
        window.removeEventListener('orientationchange', updateViewportHeight)
        document.removeEventListener('touchstart', onTouchStart)
        document.removeEventListener('touchend', onTouchEnd)
      }
    }

    const listeners: Array<Promise<{ remove: () => void }>> = []
    // ─── 1. Android Back Button ─────────────────────────────────────────────────
    // Without this, the back button exits the app instead of navigating back
    if (platform === 'android') {
      listeners.push(
        App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back()
            return
          }
          if (navigateToParent()) return

          // At the true root of the app — exit.
          App.exitApp()
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
      viewport?.removeEventListener('resize', updateViewportHeight)
      viewport?.removeEventListener('scroll', updateViewportHeight)
      window.removeEventListener('orientationchange', updateViewportHeight)
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
      listeners.forEach((listenerPromise) => {
        listenerPromise.then((listener) => listener.remove())
      })
    }
  }, [navigateToParent, router])
}
