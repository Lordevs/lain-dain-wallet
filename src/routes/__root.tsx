import { useState, useEffect } from 'react'
import { createRootRoute, Outlet, redirect } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { SplashScreen } from '@capacitor/splash-screen'
import { useAuthStore } from '@/store/use-auth-store'
import { ROUTES } from '@/constants/routes'
import AppShell from '@/components/layout/app-shell'
import coinGif from '@/assets/coin.gif'

function RootComponent() {
  const [showSplash, setShowSplash] = useState(true)
  const [isMounted, setIsMounted] = useState(true)

  useEffect(() => {
    // Hide native splash screen immediately when JS bundle loads
    SplashScreen.hide().catch(() => { })

    // Custom GIF animation duration
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2800)

    // Remove from DOM after fade-out transition
    const removeTimer = setTimeout(() => {
      setIsMounted(false)
    }, 3300)

    return () => {
      clearTimeout(timer)
      clearTimeout(removeTimer)
    }
  }, [])

  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>
      {isMounted && (
        <div
          className={`fixed inset-0 z-9999 bg-[#FEFAF1] flex flex-col items-center justify-center select-none transition-opacity duration-500 ease-out ${showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
        >
          {/* Central Animated Coin GIF */}
          <div className="w-[500px] h-[500px] flex items-center justify-center shrink-0">
            <img
              src={coinGif}
              alt="Lain Dain Coin"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Brand Logo Layout */}
          <div className="flex flex-col items-center -mt-6 shrink-0">
            <span className="text-[36px] font-extrabold tracking-tight">
              <span className="text-[#0B683A]">Lain</span>{' '}
              <span className="text-[#FDB105]">Dain</span>
            </span>
            <div className="flex items-center gap-3.5 w-44 mt-3.5 justify-center">
              <div className="h-[0.8px] flex-1 bg-[#FDB105]/60" />
              <span className="text-[12px] font-bold tracking-[0.25em] text-[#6B6B6B] uppercase leading-none">
                Wallet
              </span>
              <div className="h-[0.8px] flex-1 bg-[#FDB105]/60" />
            </div>
          </div>
        </div>
      )}
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  )
}

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const { isAuthenticated } = useAuthStore.getState()
    const isAuthRoute = location.pathname.startsWith(ROUTES.AUTH)

    if (!isAuthenticated && !isAuthRoute) {
      throw redirect({ to: ROUTES.AUTH })
    }
    if (isAuthenticated && isAuthRoute) {
      throw redirect({ to: ROUTES.DASHBOARD })
    }
  },
  component: RootComponent,
})
