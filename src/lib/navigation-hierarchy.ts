import type { useRouter } from '@tanstack/react-router'

/**
 * Resolve the structural parent of a screen. Back navigation must follow
 * product hierarchy, not whichever screens happen to be in browser history.
 */
export function parentPath(pathname: string): string | null {
  const path = pathname.replace(/\/$/, '') || '/'

  const group = path.match(/^\/groups\/([^/]+)(?:\/(.*))?$/)
  if (group) {
    const [, id, rest = ''] = group
    if (!rest) return '/'
    if (rest === 'settings') return `/groups/${id}`
    if (rest.startsWith('settings/')) return `/groups/${id}/settings`
    if (rest === 'recurring') return `/groups/${id}/settings`
    if (rest.startsWith('recurring/')) return `/groups/${id}/recurring`
    return `/groups/${id}`
  }

  const contact = path.match(/^\/contacts\/([^/]+)(?:\/(.*))?$/)
  if (contact) {
    const [, id, rest = ''] = contact
    if (!rest) return '/'
    if (rest === 'recurring') return `/contacts/${id}`
    if (rest.startsWith('recurring/')) return `/contacts/${id}/recurring`
    return `/contacts/${id}`
  }

  const transaction = path.match(/^\/transactions\/([^/]+)(?:\/(.*))?$/)
  if (transaction) return transaction[2] ? `/transactions/${transaction[1]}` : '/'

  if (/^\/settlements\/[^/]+$/.test(path)) return '/'

  if (path.startsWith('/settings/')) return '/settings'
  if (path === '/settings') return '/'
  if (path === '/personal') return '/'
  if (path.startsWith('/personal/settings/')) return '/personal/settings'
  if (path === '/personal/settings' || path.startsWith('/personal/')) return '/personal'
  if (path === '/notifications' || path === '/settle-up') return '/'
  if (path === '/privacy-policy') return '/settings'
  return null
}

/**
 * Shared "go back" resolution used by every back-navigation entry point
 * (FlowHeader's default onBack via useHierarchyBack, the Android hardware
 * back button, and the edge-swipe gesture — see use-capacitor-setup.ts).
 * Previously duplicated across two hooks, which is exactly how one of them
 * drifted out of sync with the hierarchy-based convention.
 *
 * Pops real in-app history when there is any (`__TSR_index !== 0`);
 * otherwise (a direct entry/deep link with nothing behind it) falls back
 * to the structural parent via a `replace` navigation, so it never grows
 * the stack. Returns false only when there's truly nothing to do (no
 * history to pop and no structural parent) — callers use that to decide
 * their own last-resort behavior (e.g. exiting the app).
 */
export function navigateBackInHierarchy(router: ReturnType<typeof useRouter>): boolean {
  if (router.state.location.state.__TSR_index !== 0) {
    router.history.back()
    return true
  }

  const parent = parentPath(router.state.location.pathname)
  if (!parent) return false
  void router.navigate({ to: parent, replace: true } as never)
  return true
}
