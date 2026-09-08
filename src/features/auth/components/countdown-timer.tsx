import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface CountdownTimerProps {
  initialSeconds?: number
  isResending?: boolean
  onResend: () => Promise<void>
}

export default function CountdownTimer({
  initialSeconds = 5 * 60,
  isResending = false,
  onResend,
}: CountdownTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)

  useEffect(() => {
    if (secondsLeft <= 0) return

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [secondsLeft])

  const handleResendClick = async () => {
    if (secondsLeft > 0 || isResending) return

    try {
      await onResend()
      setSecondsLeft(initialSeconds)
    } catch {
      // The parent renders the backend error; keep resend available for retry.
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center justify-center gap-x-4 mt-5 px-1 select-none">
      <p className="text-sm text-muted-foreground">
        Didn’t receive it?{' '}
        <Button
          type="button"
          variant="link"
          disabled={secondsLeft > 0 || isResending}
          onClick={handleResendClick}
          className="p-0 h-auto font-bold text-primary hover:underline disabled:text-[#C8C3BB] disabled:no-underline"
        >
          {isResending ? 'Resending…' : 'Resend'}
        </Button>
      </p>

      {secondsLeft > 0 && (
        <div
          aria-label={`You can resend the WhatsApp verification code in ${formatTime(secondsLeft)}`}
          className="bg-muted px-3 py-1 rounded-full text-xs font-bold text-muted-foreground tabular-nums"
        >
          {formatTime(secondsLeft)}
        </div>
      )}
    </div>
  )
}
