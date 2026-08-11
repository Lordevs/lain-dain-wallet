import type { ReactNode } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { useAuthStore } from '@/store/use-auth-store'
import { ROUTES } from '@/constants/routes'
import BottomNav from './bottom-nav'


// Exact paths or path prefixes where the bottom nav should be hidden.
// These are full-screen flows and detail views that have their own navigation.
const HIDE_NAV_PREFIXES = [
  ROUTES.AUTH,                                 // '/auth' — nothing to navigate to yet
  ROUTES.ONBOARDING,                           // '/onboarding' — same
  ROUTES.CONTACTS,                             // '/contacts' all child routes
  ROUTES.GROUPS,                               // '/groups' all child routes
  ROUTES.TRANSACTIONS,                         // '/transactions' all child routes
  ROUTES.SETTINGS,                             // '/settings' and all sub-screens
  ROUTES.SETTLE_UP,                            // '/settle-up' screen
]

function shouldShowNav(pathname: string): boolean {
  // The Personal landing page owns a tab-bar item, but every nested Personal
  // flow is full-screen. The old '/personal/' prefix was later suffixed with
  // another '/', producing '/personal//' and accidentally showing the nav on
  // Add Entry and other sub-screens.
  if (pathname.startsWith(`${ROUTES.PERSONAL}/`) && pathname !== `${ROUTES.PERSONAL}/`) {
    return false
  }
  return !HIDE_NAV_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
}

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { isAuthenticated } = useAuthStore()
  const state = useRouterState()
  const pathname = state.location.pathname
  const search = state.location.search as { search?: string }

  const isSearchActive = search?.search === 'active'
  const showNav = isAuthenticated && shouldShowNav(pathname) && !isSearchActive
  const usesFixedViewport = pathname === ROUTES.DASHBOARD
    || pathname === ROUTES.PERSONAL
    || pathname === `${ROUTES.PERSONAL}/`
    || pathname === ROUTES.USER_PROFILE

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col bg-[#FEFAF1]">
      {/* Scrollable content area */}
      {/* #root already reserves the device safe-area insets. Screens without
          the app tab bar must not reserve --safe-bottom again: on Android
          gesture navigation that creates a visible dead strip, while on
          three-button navigation it doubles the system-bar clearance. */}
      <main className={`flex-1 min-h-0 flex flex-col ${usesFixedViewport ? 'overflow-hidden' : 'overflow-y-auto'} ${showNav ? 'pb-15' : 'pb-0'}`}>
        {children}
      </main>

      {/* Fixed bottom navigation — hidden on flow/detail screens */}
      {showNav && <BottomNav />}
    </div>
  )
}
