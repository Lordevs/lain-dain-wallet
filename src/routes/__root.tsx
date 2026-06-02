import { createRootRoute, Outlet, redirect } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useAuthStore } from '@/store/use-auth-store'
import { ROUTES } from '@/constants/routes'
import AppShell from '@/components/layout/app-shell'

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
  component: () => (
    <>
      <AppShell>
        <Outlet />
      </AppShell>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
})
