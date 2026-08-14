import { Home, Bell, User } from 'lucide-react'
import { Link, useRouterState } from '@tanstack/react-router'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { useUnreadNotificationCountQuery } from '@/features/notifications/api/use-unread-count-query'

// ─── Nav Items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Personal', icon: User, to: ROUTES.PERSONAL },
  { label: 'Home', icon: Home, to: ROUTES.DASHBOARD },
  { label: 'Notifications', icon: Bell, to: ROUTES.NOTIFICATIONS },
] as const

// ─── Active matching ──────────────────────────────────────────────────────────

/**
 * Returns true when `pathname` belongs to the nav item's section.
 * Dashboard (/) is only active on exact "/" match.
 * All others use a prefix match so nested routes stay highlighted.
 */
function isNavItemActive(to: string, pathname: string): boolean {
  if (to === ROUTES.DASHBOARD) return pathname === ROUTES.DASHBOARD
  return pathname === to || pathname.startsWith(to + '/')
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * BottomNav — fixed tab bar rendered on all main screens.
 * Hidden automatically by AppShell on flow/detail routes.
 */
export default function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { data: unread } = useUnreadNotificationCountQuery()

  return (
    <nav
      className="fixed bottom-[calc(0.75rem+var(--safe-bottom))] left-1/2 z-50 box-border h-16 w-[min(28rem,calc(100%_-_max(1.5rem,var(--safe-left))_-_max(1.5rem,var(--safe-right))))] -translate-x-1/2 rounded-[26px] border border-[#E8E4DC] bg-white/95 px-2 shadow-[0_8px_28px_rgba(29,35,31,0.16)] backdrop-blur-xl select-none"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-full w-full items-stretch justify-between">
        {NAV_ITEMS.map(({ label, icon: Icon, to }) => {
          const isActive = isNavItemActive(to, pathname)

          return (
            <Link
                key={to}
                to={to}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className="flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center px-2"
              >
                <div
                  className={cn(
                    'relative flex size-8 items-center justify-center rounded-full transition-all duration-200 sm:size-9',
                    isActive ? 'bg-[#DCEFE4]' : 'bg-transparent',
                  )}
                >
                  <Icon
                    className={cn('size-5 sm:size-5.5', isActive ? 'text-primary' : 'text-[#6B6B6B]')}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  {to === ROUTES.NOTIFICATIONS && !!unread?.count && (
                    <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C96A1B] px-1 text-[9px] font-bold leading-none text-white">
                      {unread.count > 9 ? '9+' : unread.count}
                    </span>
                  )}
                </div>
                <span className={cn(
                  'max-w-full truncate text-[clamp(9px,2.5vw,11px)] font-semibold leading-tight',
                  isActive ? 'text-primary' : 'text-[#6B6B6B]',
                )}>
                  {label}
                </span>
              </Link>
          )
        })}
      </div>
    </nav>
  )
}
