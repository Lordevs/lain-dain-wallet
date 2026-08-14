import { useRef, useState, type ReactNode, type TouchEvent } from 'react'
import { useRouter, useRouterState } from '@tanstack/react-router'
import { RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/store/use-auth-store'
import { ROUTES } from '@/constants/routes'
import BottomNav from './bottom-nav'
import { queryClient } from '@/lib/query-client'


// Exact paths or path prefixes where the bottom nav should be hidden.
// These are full-screen flows and detail views that have their own navigation.
const HIDE_NAV_PREFIXES = [
  ROUTES.AUTH,                                 // '/auth' — nothing to navigate to yet
  ROUTES.ONBOARDING,                           // '/onboarding' — same
  ROUTES.PRIVACY_POLICY,                       // public legal screen
  ROUTES.CONTACTS,                             // '/contacts' all child routes
  ROUTES.GROUPS,                               // '/groups' all child routes
  ROUTES.TRANSACTIONS,                         // '/transactions' all child routes
  '/settlements',                              // settlement details and actions
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
  const router = useRouter()
  const mainRef = useRef<HTMLElement>(null)
  const pullStartY = useRef<number | null>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const pathname = state.location.pathname
  const search = state.location.search as { search?: string }

  const isSearchActive = search?.search === 'active'
  const showNav = isAuthenticated && shouldShowNav(pathname) && !isSearchActive
  const usesFixedViewport = pathname === ROUTES.DASHBOARD
    || pathname === ROUTES.PERSONAL
    || pathname === `${ROUTES.PERSONAL}/`
    || pathname === ROUTES.USER_PROFILE

  const canPullFrom = (target: EventTarget | null) => {
    let element = target instanceof HTMLElement ? target : null
    while (element && element !== mainRef.current) {
      if (element.scrollHeight > element.clientHeight && element.scrollTop > 0) return false
      element = element.parentElement
    }
    return (mainRef.current?.scrollTop ?? 0) <= 0
  }

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (isRefreshing || !canPullFrom(event.target)) return
    pullStartY.current = event.touches[0]?.clientY ?? null
  }

  const handleTouchMove = (event: TouchEvent<HTMLElement>) => {
    if (pullStartY.current === null) return
    const distance = (event.touches[0]?.clientY ?? pullStartY.current) - pullStartY.current
    setPullDistance(distance > 0 ? Math.min(distance * 0.55, 96) : 0)
  }

  const handleTouchEnd = async () => {
    const shouldRefresh = pullDistance >= 64
    pullStartY.current = null
    setPullDistance(0)
    if (!shouldRefresh || isRefreshing) return
    setIsRefreshing(true)
    await Promise.all([queryClient.invalidateQueries(), router.invalidate()])
    window.setTimeout(() => setIsRefreshing(false), 450)
  }

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col bg-[#FEFAF1]">
      {/* Scrollable content area */}
      {/* #root already reserves the device safe-area insets. Screens without
          the app tab bar must not reserve --safe-bottom again: on Android
          gesture navigation that creates a visible dead strip, while on
          three-button navigation it doubles the system-bar clearance. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1 z-60 flex justify-center transition-opacity"
        style={{ opacity: pullDistance > 8 || isRefreshing ? 1 : 0 }}
      >
        <div
          className="flex size-10 items-center justify-center rounded-full border border-border-card bg-white text-primary shadow-md transition-transform"
          style={{ transform: `translateY(${isRefreshing ? 8 : Math.max(0, pullDistance - 32)}px)` }}
        >
          <RefreshCw className={`size-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </div>
      </div>
      <main
        ref={mainRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={`flex-1 min-h-0 flex flex-col ${usesFixedViewport ? 'overflow-hidden' : 'overflow-y-auto'} ${showNav ? 'pb-20' : 'pb-0'}`}
      >
        {children}
      </main>

      {/* Fixed bottom navigation — hidden on flow/detail screens */}
      {showNav && <BottomNav />}
    </div>
  )
}
