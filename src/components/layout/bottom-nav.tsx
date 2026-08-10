import React from 'react'
import { Home, Bell, User } from 'lucide-react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Separator } from '@/components/ui/separator'
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
      className="fixed bottom-0 left-0 right-0 z-50 box-border h-[calc(3.75rem+var(--safe-bottom))] bg-white border-t-[1.08px] border-[#EFE7DD] pb-[var(--safe-bottom)] pl-[max(0.75rem,var(--safe-left))] pr-[max(0.75rem,var(--safe-right))] shadow-[0px_-3px_14px_0px_#0000000D] select-none"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-15 w-full max-w-2xl items-stretch justify-between">
        {NAV_ITEMS.map(({ label, icon: Icon, to }, idx) => {
          const isActive = isNavItemActive(to, pathname)

          return (
            <React.Fragment key={to}>
              {idx > 0 && (
                <Separator
                  orientation="vertical"
                  className="my-2.5 h-auto w-px self-stretch bg-[#EEEDED]"
                />
              )}
              <Link
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
            </React.Fragment>
          )
        })}
      </div>
    </nav>
  )
}
