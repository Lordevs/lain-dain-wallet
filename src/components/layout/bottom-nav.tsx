import React from 'react'
import { Home, Bell, User } from 'lucide-react'
import { Link, useMatchRoute } from '@tanstack/react-router'
import { Separator } from '@/components/ui/separator'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Home', icon: Home, to: ROUTES.DASHBOARD as any },
  { label: 'Notifications', icon: Bell, to: ROUTES.NOTIFICATIONS as any },
  { label: 'Profile', icon: User, to: ROUTES.PROFILE as any },
] as const

/**
 * BottomNav — fixed tab bar at the bottom of every main screen.
 * Links: Home (Dashboard), Notifications, Profile.
 */
export default function BottomNav() {
  const matchRoute = useMatchRoute()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-[1.08px] border-[#EFE7DD] h-[76px] flex items-center justify-between px-6 shadow-[0px_4.03px_18.83px_0px_#00000012] select-none">
      {NAV_ITEMS.map(({ label, icon: Icon, to }, idx) => {
        // Fallback to active = true for Home if no route matches or it's root
        const isMatch = !!matchRoute({ to: to as any, fuzzy: to !== ROUTES.DASHBOARD })
        const isActive = to === ROUTES.DASHBOARD ? (!matchRoute({ to: ROUTES.NOTIFICATIONS as any }) && !matchRoute({ to: ROUTES.PROFILE as any })) : isMatch

        return (
          <React.Fragment key={to}>
            {idx > 0 && (
              <Separator
                orientation="vertical"
                className="self-stretch my-3.5 h-auto w-px bg-[#EEEDED]"
              />
            )}
            <Link
              to={to}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-1 cursor-pointer"
            >
              <div
                className={cn(
                  'w-12 h-9 rounded-sm flex items-center justify-center transition-all duration-200',
                  isActive ? 'bg-[#DCEFE4]' : 'bg-transparent'
                )}
              >
                <Icon
                  size={24}
                  className={isActive ? 'text-primary' : 'text-[#6B6B6B]'}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </div>
              <span
                className={cn(
                  'text-[12px] font-bold tracking-tight transition-colors',
                  isActive ? 'text-primary' : 'text-[#6B6B6B]'
                )}
              >
                {label}
              </span>
            </Link>
          </React.Fragment>
        )
      })}
    </nav>
  )
}
