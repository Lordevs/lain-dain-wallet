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
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-[1.08px] border-[#EFE7DD] h-14 flex items-center justify-between px-6 shadow-[0px_4.03px_18.83px_0px_#00000012] select-none"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map(({ label, icon: Icon, to }, idx) => {
        const isActive = isNavItemActive(to, pathname)

        return (
          <React.Fragment key={to}>
            {idx > 0 && (
              <Separator
                orientation="vertical"
                className="self-stretch my-1.5 h-auto w-px bg-[#EEEDED]"
              />
            )}
            <Link
              to={to as any}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-1 cursor-pointer"
            >
              <div
                className={cn(
                  'relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200',
                  isActive ? 'bg-[#DCEFE4]' : 'bg-transparent',
                )}
              >
                <Icon
                  size={24}
                  className={isActive ? 'text-primary' : 'text-[#6B6B6B]'}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {to === ROUTES.NOTIFICATIONS && !!unread?.count && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#C96A1B] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {unread.count > 9 ? '9+' : unread.count}
                  </span>
                )}
              </div>
            </Link>
          </React.Fragment>
        )
      })}
    </nav>
  )
}
