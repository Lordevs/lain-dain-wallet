import { useRef, useState, type ReactNode } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { haptic } from '@/lib/haptics'

const REVEAL_WIDTH = 88
// Same offset/velocity thresholds as GroupBalanceCarousel's drag gesture,
// for a consistent feel with the app's one other swipe interaction.
const SWIPE_THRESHOLD = 50
const VELOCITY_THRESHOLD = 500

interface SwipeableNotificationRowProps {
  notificationId: string
  theme: 'green' | 'orange'
  onDelete: (id: string) => void
  children: ReactNode
}

export default function SwipeableNotificationRow({
  notificationId,
  theme,
  onDelete,
  children,
}: SwipeableNotificationRowProps) {
  const borderClass = theme === 'green' ? 'border-primary' : 'border-tertiary'
  const [isOpen, setIsOpen] = useState(false)
  const suppressClickRef = useRef(false)

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD) {
      setIsOpen(true)
    } else if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD) {
      setIsOpen(false)
    }
    // A drag that moved more than a few px shouldn't also let the card's
    // own onClick fire underneath it once the pointer is released.
    if (Math.abs(info.offset.x) > 4) {
      suppressClickRef.current = true
      requestAnimationFrame(() => {
        suppressClickRef.current = false
      })
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-[18px] border-[0.8px] ${borderClass}`}>
      {/* Reveal panel — absolutely positioned behind the row, fixed width */}
      <div className="absolute inset-y-0 right-0 flex items-stretch" style={{ width: REVEAL_WIDTH }}>
        <button
          type="button"
          onClick={() => {
            haptic.heavy()
            setIsOpen(false)
            onDelete(notificationId)
          }}
          className="flex-1 bg-destructive text-white flex items-center justify-center rounded-r-[18px] border-0 cursor-pointer outline-none"
          aria-label="Delete notification"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <motion.div
        className="relative touch-pan-y"
        drag="x"
        dragConstraints={{ left: -REVEAL_WIDTH, right: 0 }}
        dragElastic={0.05}
        animate={{ x: isOpen ? -REVEAL_WIDTH : 0 }}
        transition={{ ease: 'easeOut', duration: 0.15 }}
        onDragEnd={handleDragEnd}
        onClickCapture={(e) => {
          if (suppressClickRef.current || isOpen) {
            e.stopPropagation()
            if (isOpen) setIsOpen(false)
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
