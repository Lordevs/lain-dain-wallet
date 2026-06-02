import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/use-auth-store'
import { ROUTES } from '@/constants/routes'
import DashboardScreen from '@/features/dashboard/dashboard-screen'

function App() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: ROUTES.AUTH })
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) return null

  return <DashboardScreen />
}

export default App
