import { useState, useRef, useEffect } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { motion, type PanInfo } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GroupBalanceCarouselProps {
  isReceivable: boolean
  formattedNetAmount: string
  formattedReceivable: string
  formattedPayable: string
  onRemind: () => void
}

export default function GroupBalanceCarousel({
  isReceivable,
  formattedNetAmount,
  formattedReceivable,
  formattedPayable,
  // onRemind,
}: GroupBalanceCarouselProps) {
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Track carousel card metrics dynamically to support accurate pixel snapping
  const [cardWidth, setCardWidth] = useState(0)
  const [slideDistance, setSlideDistance] = useState(0)

  useEffect(() => {
    if (containerRef.current) {
      // Use full container width since padding is removed
      const measuredWidth = containerRef.current.clientWidth
      setCardWidth(measuredWidth)
      setSlideDistance(measuredWidth + 16) // card width + flex gap (16px)
    }
  }, [])

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50
    const offset = info.offset.x
    const velocity = info.velocity.x

    let nextIndex = activeCardIndex
    // Advance card based on drag offset or swipe velocity
    if (offset < -swipeThreshold || velocity < -500) {
      nextIndex = 1
    } else if (offset > swipeThreshold || velocity > 500) {
      nextIndex = 0
    }

    setActiveCardIndex(nextIndex)
  }

  const handleDotClick = (index: number) => {
    setActiveCardIndex(index)
  }

  return (
    <div ref={containerRef} className="mx-6 mb-6 mt-4 relative overflow-hidden select-none">
      {/* Sliding track container */}
      <motion.div
        className="flex gap-4 cursor-grab active:cursor-grabbing w-max"
        animate={{ x: activeCardIndex === 0 ? 0 : -slideDistance }}
        transition={{ ease: "easeOut", duration: 0.15 }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -slideDistance, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        {/* Card 1 */}
        <div
          onClick={() => handleDotClick(1)}
          style={{ width: cardWidth || 'auto' }}
          className="shrink-0 bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex items-center justify-between min-h-[148px] relative text-left select-none touch-pan-y"
        >
          <div className="flex flex-col text-left">
            <span className="text-[#6B6B6B] text-[13px] font-semibold">
              Net Balance
            </span>
            <span className={cn('text-3xl font-extrabold mt-2 leading-none tracking-tight', isReceivable ? 'text-positive' : 'text-[#C96A1B]')}>
              {formattedNetAmount}
            </span>
          </div>

          {/* {isReceivable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemind()
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#0B683A4D] bg-[#E4F2EB] text-positive text-xs font-bold transition-all hover:bg-[#E4F2EB]/80 shrink-0 cursor-pointer outline-none"
            >
              <Bell size={13} className="text-positive" strokeWidth={2.5} />
              Remind
            </button>
          )} */}

          {/* Pagination dots at bottom right */}
          <div className="absolute bottom-3.5 right-4 flex gap-1.5 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleDotClick(0)
              }}
              className={cn(
                "w-2.5 h-2.5 rounded-full p-0 border-0 outline-none cursor-pointer transition-colors",
                activeCardIndex === 0 ? "bg-positive" : "bg-[#9A9590]/40"
              )}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleDotClick(1)
              }}
              className={cn(
                "w-2.5 h-2.5 rounded-full p-0 border-0 outline-none cursor-pointer transition-colors",
                activeCardIndex === 1 ? "bg-positive" : "bg-[#9A9590]/40"
              )}
            />
          </div>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => handleDotClick(0)}
          style={{ width: cardWidth || 'auto' }}
          className="shrink-0 bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex items-center justify-between min-h-[148px] relative text-left select-none touch-pan-y"
        >
          {/* Two Column Layout Split by Light Vertical Line */}
          <div className="flex-1 flex items-stretch divide-x divide-[#EFE7DD] h-full">
            {/* Left Column: You will receive */}
            <div className="flex-1 flex flex-col items-center text-center pr-4">
              <span className="text-positive text-[13px] font-normal">
                You will receive
              </span>
              <span className="text-xl font-extrabold text-positive mt-2.5 leading-none tracking-tight">
                {formattedReceivable}
              </span>
              <div className="mt-3.5 flex items-center justify-start">
                <div className="w-8 h-8 rounded-full bg-[#E4F2EB] flex items-center justify-center text-positive">
                  <ArrowDown size={14} className="text-positive" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* Right Column: You will pay */}
            <div className="flex-1 flex flex-col items-center text-center pl-6">
              <span className="text-[#C96A1B] text-[13px] font-normal">
                You will pay
              </span>
              <span className="text-xl font-extrabold text-[#C96A1B] mt-2.5 leading-none tracking-tight">
                {formattedPayable}
              </span>
              <div className="mt-3.5 flex items-center justify-start">
                <div className="w-8 h-8 rounded-full bg-[#FFF8E1] flex items-center justify-center text-[#C96A1B]">
                  <ArrowUp size={14} className="text-[#C96A1B]" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>

          {/* Pagination dots at bottom right */}
          <div className="absolute bottom-3.5 right-4 flex gap-1.5 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleDotClick(0)
              }}
              className={cn(
                "w-2.5 h-2.5 rounded-full p-0 border-0 outline-none cursor-pointer transition-colors",
                activeCardIndex === 0 ? "bg-positive" : "bg-[#9A9590]/40"
              )}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleDotClick(1)
              }}
              className={cn(
                "w-2.5 h-2.5 rounded-full p-0 border-0 outline-none cursor-pointer transition-colors",
                activeCardIndex === 1 ? "bg-positive" : "bg-[#9A9590]/40"
              )}
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
