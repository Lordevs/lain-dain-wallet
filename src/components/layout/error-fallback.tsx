import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { logError } from '@/lib/log-error'

export default function ErrorFallback({ error, info, reset }: ErrorComponentProps) {
  const navigate = useNavigate()

  useEffect(() => {
    logError(error, info)
  }, [error, info])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#FEFAF1] text-center gap-4">
      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle size={26} className="text-destructive" />
      </div>

      <div>
        <h1 className="font-bold text-lg text-foreground">Something went wrong</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-xs">
          An unexpected error occurred. You can try again or head back to the dashboard.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 w-full max-w-xs mt-2">
        <Button
          onClick={reset}
          className="w-full h-12 bg-primary text-white rounded-full font-bold text-base hover:bg-primary/95 transition-all"
        >
          Try Again
        </Button>
        <button
          type="button"
          onClick={() => navigate({ to: ROUTES.DASHBOARD })}
          className="text-primary font-bold hover:underline border-0 bg-transparent cursor-pointer text-sm"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
