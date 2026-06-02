import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface CountdownTimerProps {
  initialSeconds?: number
  onResend: () => void
}

export default function CountdownTimer({
  initialSeconds = 60,
  onResend
}: CountdownTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)

  useEffect(() => {
    if (secondsLeft > 0) {
      const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [secondsLeft])

  const handleResendClick = () => {
    setSecondsLeft(initialSeconds)
    onResend()
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center justify-center gap-x-4 mt-5 px-1 select-none">
      <p className="text-sm text-muted-foreground">
        Didn't receive it?{' '}
        <Button
          type="button"
          variant="link"
          disabled={secondsLeft > 0}
          onClick={handleResendClick}
          className="p-0 h-auto font-bold text-primary hover:underline disabled:text-[#C8C3BB] disabled:no-underline"
        >
          Resend
        </Button>
      </p>

      {secondsLeft > 0 && (
        <div className="bg-muted px-3 py-1 rounded-full text-xs font-bold text-muted-foreground">
          {formatTime(secondsLeft)}
        </div>
      )}
    </div>
  )
}
