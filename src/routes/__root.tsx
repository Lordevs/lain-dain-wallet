import { useState, useEffect } from 'react'
import { createRootRoute, Outlet, redirect } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { SplashScreen } from '@capacitor/splash-screen'
import { useAuthStore } from '@/store/use-auth-store'
import { ROUTES } from '@/constants/routes'
import AppShell from '@/components/layout/app-shell'
import { useCapacitorSetup } from '@/hooks/use-capacitor-setup'
import { usePushNotifications } from '@/features/notifications/hooks/use-push-notifications'
import { Toaster } from '@/components/ui/sonner'
import coinAnimation from '@/assets/coin.webp'

function RootComponent() {
  const [showSplash, setShowSplash] = useState(true)

  // Initialise all Capacitor native platform features (keyboard, back button, lifecycle)
  useCapacitorSetup()
  usePushNotifications()

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
      <Toaster />
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
              <span className="text-positive">Lain</span>{' '}
              <span className="text-[#FDB105]">Dain</span>
            </span>
            <div className="flex items-center gap-3.5 w-44 mt-3.5 justify-center">
              <div className="h-[0.8px] flex-1 bg-[#FDB105]/60" />
              <span className="text-[12px] font-normal tracking-[0.25em] text-positive uppercase leading-none">
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

// Three states, each with exactly one place they're allowed to be:
//   unauthenticated            → /auth only
//   authenticated, incomplete  → /onboarding only (already has valid
//                                 tokens from OTP verify — see otp-form.tsx
//                                 — so this is "finish setup," not "log in
//                                 again"; resumable across app restarts via
//                                 lib/api/bootstrap.ts)
//   authenticated, complete    → everywhere except /auth and /onboarding
// Routing (not component-local step state) is what makes this a real
// boundary — it's what stops a signed-in user from navigating back to the
// phone/OTP screens, and stops an incomplete profile from reaching the
// rest of the app, regardless of how they try to get there (back button,
// direct URL, deep link).
export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const { isAuthenticated, userProfile } = useAuthStore.getState()
    const pathname = location.pathname
    const isAuthRoute = pathname.startsWith(ROUTES.AUTH)
    const isOnboardingRoute = pathname.startsWith(ROUTES.ONBOARDING)
    const profileComplete = userProfile?.profileComplete ?? false

    if (!isAuthenticated) {
      if (!isAuthRoute) throw redirect({ to: ROUTES.AUTH })
      return
    }

    if (!profileComplete) {
      if (!isOnboardingRoute) throw redirect({ to: ROUTES.ONBOARDING })
      return
    }

    if (isAuthRoute || isOnboardingRoute) {
      throw redirect({ to: ROUTES.DASHBOARD })
    }
  },
  component: RootComponent,
})
