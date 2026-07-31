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
  ROUTES.PERSONAL + '/',                       // '/personal' sub-screens e.g. /personal/reports
  ROUTES.SETTLE_UP,                            // '/settle-up' screen
]

function shouldShowNav(pathname: string): boolean {
  return !HIDE_NAV_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
}

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { isAuthenticated } = useAuthStore()
  const state = useRouterState()
  const pathname = state.location.pathname
  const search = state.location.search as any

  const isSearchActive = search?.search === 'active'
  const showNav = isAuthenticated && shouldShowNav(pathname) && !isSearchActive

  return (
    <div className="flex flex-col min-h-dvh w-full bg-[#FEFAF1] relative">
      {/* Scrollable content area */}
      <main className={`flex-1 flex flex-col overflow-y-auto ${showNav ? 'pb-[76px]' : ''}`}>
        {children}
      </main>

      {/* Fixed bottom navigation — hidden on flow/detail screens */}
      {showNav && <BottomNav />}
    </div>
  )
}
