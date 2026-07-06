import { useState } from 'react'
import { Bell, ArrowUp, ArrowDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const cardVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  }
}

interface GroupBalanceCarouselProps {
  isReceivable: boolean
  formattedNetAmount: string
  onRemind: () => void
}

/**
 * Two-card swipeable/draggable carousel on the group detail screen: net balance
 * on the first card, receive/pay breakdown on the second. Owns its own active-card
 * state since nothing outside this carousel needs to know which card is showing.
 */
export default function GroupBalanceCarousel({ isReceivable, formattedNetAmount, onRemind }: GroupBalanceCarouselProps) {
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left')

  return (
    <div className="px-6 mb-6 mt-4 relative overflow-hidden">
      <div className="relative min-h-[148px]">
        <AnimatePresence custom={slideDirection} mode="wait">
          {activeCardIndex === 0 ? (
            <motion.div
              key="card1"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                const swipeThreshold = 50
                if (info.offset.x < -swipeThreshold) {
                  // Swipe left on card 0 → advance to card 1
                  setSlideDirection('left')
                  setActiveCardIndex(1)
                }
                // Swipe right on card 0 → no card -1, do nothing
              }}
              onClick={() => {
                setSlideDirection('left')
                setActiveCardIndex(1)
              }}
              className="bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex items-center justify-between cursor-grab active:cursor-grabbing min-h-[148px] relative text-left select-none touch-pan-y"
            >
              <div className="flex flex-col text-left">
                <span className="text-[#6B6B6B] text-[13px] font-semibold">
                  Net Balance
                </span>
                <span className={cn('text-3xl font-extrabold mt-2 leading-none tracking-tight', isReceivable ? 'text-positive' : 'text-[#C96A1B]')}>
                  {formattedNetAmount}
                </span>
              </div>

              {isReceivable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation() // Prevent toggling the card when clicking remind
                    onRemind()
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#0B683A4D] bg-[#E4F2EB] text-positive text-xs font-bold transition-all hover:bg-[#E4F2EB]/80 shrink-0 cursor-pointer outline-none"
                >
                  <Bell size={13} className="text-positive" strokeWidth={2.5} />
                  Remind
                </button>
              )}

              {/* Pagination dots at bottom right */}
              <div className="absolute bottom-3.5 right-4 flex gap-1.5 z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSlideDirection('right')
                    setActiveCardIndex(0)
                  }}
                  className="w-2.5 h-2.5 rounded-full bg-positive p-0 border-0 outline-none cursor-pointer"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSlideDirection('left')
                    setActiveCardIndex(1)
                  }}
                  className="w-2.5 h-2.5 rounded-full bg-[#9A9590]/40 p-0 border-0 outline-none cursor-pointer"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="card2"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                const swipeThreshold = 50
                if (info.offset.x > swipeThreshold) {
                  // Swipe right on card 1 → go back to card 0
                  setSlideDirection('right')
                  setActiveCardIndex(0)
                }
                // Swipe left on card 1 → no card 2, do nothing
              }}
              onClick={() => {
                setSlideDirection('right')
                setActiveCardIndex(0)
              }}
              className="bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex items-center justify-between cursor-grab active:cursor-grabbing min-h-[148px] relative text-left select-none touch-pan-y"
            >
              {/* Two Column Layout Split by Light Vertical Line */}
              <div className="flex-1 flex items-stretch divide-x divide-[#EFE7DD] h-full">
                {/* Left Column: You will receive */}
                <div className="flex-1 flex flex-col items-center text-center pr-4">
                  <span className="text-positive text-[13px] font-normal">
                    You will receive
                  </span>
                  <span className="text-xl font-extrabold text-positive mt-2.5 leading-none tracking-tight">
                    Rs. 13,800
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
                    Rs. 2,230
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
                    setSlideDirection('right')
                    setActiveCardIndex(0)
                  }}
                  className="w-2.5 h-2.5 rounded-full bg-[#9A9590]/40 p-0 border-0 outline-none cursor-pointer"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSlideDirection('left')
                    setActiveCardIndex(1)
                  }}
                  className="w-2.5 h-2.5 rounded-full bg-positive p-0 border-0 outline-none cursor-pointer"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
