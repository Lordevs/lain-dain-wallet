import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/use-auth-store'

function App() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/auth' })
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex flex-col flex-1 p-6 text-left select-none">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-xs font-bold text-primary tracking-wider uppercase">Lain Dain Wallet</span>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mt-1">Dashboard</h1>
        </div>

        <button
          onClick={() => useAuthStore.getState().logout()}
          className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-input rounded-[24px] p-6 text-center">
        <p className="font-bold text-foreground">You are logged in!</p>
        <p className="text-muted-foreground text-sm mt-1">
          This is the primary dashboard interface.
        </p>
      </div>
    </div>
  )
}

export default App
