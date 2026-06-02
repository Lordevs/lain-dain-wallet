import type { ReactNode } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { useAuthStore } from '@/store/use-auth-store'
import BottomNav from './bottom-nav'

// Exact paths or path prefixes where the bottom nav should be hidden.
// These are full-screen flows and detail views that have their own navigation.
const HIDE_NAV_PREFIXES = [
  '/contacts/new',       // New contact / group flow
  '/contacts/$',         // Contact detail  (dynamic segment)
  '/transactions/$',     // Transaction detail (dynamic segment)
  '/settings',
]

function shouldShowNav(pathname: string): boolean {
  return !HIDE_NAV_PREFIXES.some((prefix) => {
    // Dynamic segment pattern e.g. "/contacts/$" → match "/contacts/<anything>"
    if (prefix.endsWith('/$')) {
      const base = prefix.slice(0, -1) // "/contacts/"
      return pathname.startsWith(base) && pathname !== base.slice(0, -1)
    }
    return pathname === prefix || pathname.startsWith(prefix + '/')
  })
}

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { isAuthenticated } = useAuthStore()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const showNav = isAuthenticated && shouldShowNav(pathname)

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
