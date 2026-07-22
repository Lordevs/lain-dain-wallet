import { Network } from '@capacitor/network'
import { onlineManager } from '@tanstack/react-query'

/**
 * Replaces TanStack Query's default browser online/offline listener with
 * @capacitor/network — the browser's `navigator.onLine`/`window` events
 * this defaults to don't fire reliably inside a native WebView. Call once
 * from __root.tsx alongside useCapacitorSetup(); onlineManager.setOnline()
 * is what actually pauses/resumes queued mutations (see main.tsx).
 */
export function setUpNetworkStatusListener() {
  onlineManager.setEventListener((setOnline) => {
    let removeListener: (() => void) | undefined

    Network.getStatus().then((status) => setOnline(status.connected))

    Network.addListener('networkStatusChange', (status) => {
      setOnline(status.connected)
    }).then((handle) => {
      removeListener = () => handle.remove()
    })

    return () => removeListener?.()
  })
}
