import { useRef, useState, type ReactNode } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import { Archive } from 'lucide-react'
import { haptic } from '@/lib/haptics'

const REVEAL_WIDTH = 88
const SWIPE_THRESHOLD = 50
const VELOCITY_THRESHOLD = 500

interface SwipeableLedgerCardProps {
  name: string
  disabled: boolean
  onHide: () => void
  children: ReactNode
}

export default function SwipeableLedgerCard({ name, disabled, onHide, children }: SwipeableLedgerCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const suppressClickRef = useRef(false)

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!disabled && (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD)) {
      setIsOpen(true)
    } else if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD) {
      setIsOpen(false)
    }
    if (Math.abs(info.offset.x) > 4) {
      suppressClickRef.current = true
      requestAnimationFrame(() => { suppressClickRef.current = false })
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-y-0 right-0 flex items-stretch" style={{ width: REVEAL_WIDTH }}>
        <button
          type="button"
          aria-label={`Hide ${name} from dashboard`}
          disabled={disabled}
          onClick={() => {
            haptic.heavy()
            setIsOpen(false)
            onHide()
          }}
          className="flex flex-1 cursor-pointer items-center justify-center rounded-r-lg border-0 bg-[#6B6B6B] text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Archive size={20} />
        </button>
      </div>
      <motion.div
        className="relative touch-pan-y"
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: -REVEAL_WIDTH, right: 0 }}
        dragElastic={0.05}
        animate={{ x: isOpen ? -REVEAL_WIDTH : 0 }}
        transition={{ ease: 'easeOut', duration: 0.15 }}
        onDragEnd={handleDragEnd}
        onClickCapture={(event) => {
          if (suppressClickRef.current || isOpen) {
            event.stopPropagation()
            if (isOpen) setIsOpen(false)
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
