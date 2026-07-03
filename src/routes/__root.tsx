import { useState, useEffect } from 'react'
import { createRootRoute, Outlet, redirect } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { SplashScreen } from '@capacitor/splash-screen'
import { useAuthStore } from '@/store/use-auth-store'
import { ROUTES } from '@/constants/routes'
import AppShell from '@/components/layout/app-shell'
import coinAnimation from '@/assets/coin.webp'

function RootComponent() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // Hide native splash screen immediately when JS bundle loads
    SplashScreen.hide().catch(() => { })

    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2800)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>
      {showSplash && (
        <div
          className="fixed inset-0 z-9999 bg-[#FEFAF1] flex flex-col items-center justify-center select-none"
        >
          {/* Central Animated Coin GIF */}
          <div className="relative flex flex-col items-center shrink-0 mb-24">
            <div className="w-[250px] h-[250px] flex items-center justify-center">
              <img
                src={coinAnimation}
                alt="Lain Dain Coin"
                className="w-full h-full object-contain animate-bounce-slow"
              />
            </div>
            {/* Shadow under the coin */}
            <div
              className="w-[180px] h-[15px] mt-4 rounded-[50%] opacity-65 bg-[radial-gradient(40.82%_40.82%_at_50%_50%,#949494_0%,rgba(254,250,241,0)_100%)] backdrop-blur-[10.2px]"
            />
          </div>

          {/* Brand Logo Layout */}
          <div className="flex flex-col items-center -mt-6 shrink-0">
            <span className="text-[48px] font-bold tracking-tight">
              <span className="text-[#0B683A]">Lain</span>{' '}
              <span className="text-[#FDB105]">Dain</span>
            </span>
            <div className="flex items-center gap-3.5 w-44 mt-3.5 justify-center">
              <div className="h-[0.8px] flex-1 bg-[#FDB105]/60" />
              <span className="text-[12px] font-normal tracking-[0.25em] text-[#0B683A] uppercase leading-none">
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
