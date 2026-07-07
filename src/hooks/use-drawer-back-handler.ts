import { useEffect, useRef, useCallback } from 'react'

/**
 * Intercepts the mobile hardware back button (via popstate) to close a drawer
 * instead of navigating to the previous page.
 *
 * Strategy:
 *  - When the drawer opens, push a sentinel history entry (same URL, no route change).
 *  - When back is pressed, the sentinel is popped → popstate fires → we close the drawer.
 *  - When the drawer is closed via a button, we also pop the sentinel (via history.back())
 *    and suppress the resulting popstate event using a bypass flag to avoid a double-close.
 *
 * @param isOpen  - Whether the drawer is currently open.
 * @param onClose - The state setter / callback that closes the drawer.
 * @returns A stable close function to pass as the drawer's `onClose` prop.
 *          It closes the drawer AND cleans up the sentinel history entry.
 */
export function useDrawerBackHandler(isOpen: boolean, onClose: () => void): () => void {
  // Keep a ref to onClose so the popstate handler always calls the latest version
  // without needing to re-subscribe every render.
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  // Whether we currently have a sentinel entry in history
  const pushedRef = useRef(false)

  // Whether we triggered history.back() ourselves (to pop the sentinel after a button close)
  // — in that case we must ignore the resulting popstate event.
  const bypassRef = useRef(false)

  // Push a sentinel history entry when the drawer opens
  useEffect(() => {
    if (isOpen && !pushedRef.current) {
      window.history.pushState({ __drawerSentinel: true }, '')
      pushedRef.current = true
    }
  }, [isOpen])

  // Intercept the popstate event (fires when the hardware back button pops history)
  useEffect(() => {
    const handler = () => {
      if (bypassRef.current) {
        // This popstate came from our own history.back() call — swallow it.
        bypassRef.current = false
        return
      }
      if (pushedRef.current) {
        // Back button popped our sentinel — close the drawer.
        pushedRef.current = false
        onCloseRef.current()
      }
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, []) // stable — uses refs internally

  // The close function to hand to the drawer's onClose prop.
  // Closes the drawer AND pops the sentinel entry we pushed.
  return useCallback(() => {
    if (pushedRef.current) {
      pushedRef.current = false
      bypassRef.current = true      // tell the popstate handler to ignore the next event
      onCloseRef.current()          // close the drawer immediately
      window.history.back()         // pop the sentinel (same-URL entry — no route change)
    } else {
      onCloseRef.current()
    }
  }, [])
}
