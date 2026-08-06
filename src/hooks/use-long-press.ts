import { useCallback, useRef } from 'react'

const LONG_PRESS_MS = 450
const MOVE_CANCEL_PX = 10

interface UseLongPressOptions {
  onLongPress: () => void
  disabled?: boolean
}

/** Distinguishes a long-press from a tap, pointer-events based (covers
 * touch + mouse). Mirrors swipeable-notification-row.tsx's
 * suppressClickRef idiom — once a long-press fires, the trailing click on
 * release is suppressed so it doesn't also fire the row's own onClick. */
export function useLongPress({ onLongPress, disabled }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPos = useRef<{ x: number; y: number } | null>(null)
  const firedRef = useRef(false)

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    startPos.current = null
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return
    firedRef.current = false
    startPos.current = { x: e.clientX, y: e.clientY }
    timerRef.current = setTimeout(() => {
      firedRef.current = true
      onLongPress()
    }, LONG_PRESS_MS)
  }, [disabled, onLongPress])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!startPos.current) return
    if (Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y) > MOVE_CANCEL_PX) clear()
  }, [clear])

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (firedRef.current) {
      e.stopPropagation()
      e.preventDefault()
      firedRef.current = false
    }
  }, [])

  return { onPointerDown, onPointerMove, onPointerUp: clear, onPointerLeave: clear, onClickCapture }
}
