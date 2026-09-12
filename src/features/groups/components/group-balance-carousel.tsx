import { useState, useRef, useEffect } from 'react'
import { Bell, ArrowUp, ArrowDown } from 'lucide-react'
import { motion, type PanInfo } from 'framer-motion'
import { cn } from '@/lib/utils'
import CompactAmount from '@/components/shared/compact-amount'

interface GroupBalanceCarouselProps {
  isReceivable: boolean
  netAmount: number
  receivable: number
  payable: number
  currency: string
  hasReceivable: boolean
  onRemind: () => void
}

export default function GroupBalanceCarousel({
  isReceivable,
  netAmount,
  receivable,
  payable,
  currency,
  hasReceivable,
  onRemind,
}: GroupBalanceCarouselProps) {
  // A zero net does not mean the group is settled: receivables and
  // payables can cancel each other (for example +875 and -875). In that
  // edge case, surface the gross outstanding amount instead of a
  // misleading zero while the second card retains the directional split.
  const hasOffsettingBalances = netAmount === 0 && (receivable > 0 || payable > 0)
  const headlineAmount = hasOffsettingBalances ? receivable + payable : Math.abs(netAmount)
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const [slideDistance, setSlideDistance] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSlideDistance = () => {
      setSlideDistance(container.getBoundingClientRect().width + 16)
    }

    updateSlideDistance()
    const observer = new ResizeObserver(updateSlideDistance)
    observer.observe(container)

    return () => observer.disconnect()
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
    <div ref={containerRef} className="mx-6 mb-6 mt-4 min-h-[148px] relative overflow-hidden select-none">
      {/* Sliding track container */}
      <motion.div
        className="flex w-full gap-4 cursor-grab active:cursor-grabbing"
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
          className="w-full min-w-full shrink-0 bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex items-center justify-between min-h-[148px] relative text-left select-none touch-pan-y"
        >
          <div className="flex flex-col text-left">
            <span className="text-[#6B6B6B] text-[13px] font-semibold">
              {hasOffsettingBalances ? 'Total Outstanding' : 'Net Balance'}
            </span>
            <span className={cn('text-3xl font-extrabold mt-2 leading-none tracking-tight', hasOffsettingBalances ? 'text-[#C96A1B]' : isReceivable ? 'text-positive' : 'text-[#C96A1B]')}>
              <CompactAmount
                amount={headlineAmount}
                currency={currency}
                drawerTitle={hasOffsettingBalances ? 'Total Outstanding' : 'Net Balance'}
              />
            </span>
          </div>

          {hasReceivable && (
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
          )}

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
          className="w-full min-w-full shrink-0 bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex items-center justify-between min-h-[148px] relative text-left select-none touch-pan-y"
        >
          {/* Two Column Layout Split by Light Vertical Line */}
          <div className="flex-1 flex items-stretch divide-x divide-[#EFE7DD] h-full">
            {/* Left Column: You will receive */}
            <div className="flex-1 flex flex-col items-center text-center pr-4">
              <span className="text-positive text-[13px] font-normal">
                You will receive
              </span>
              <span className="text-xl font-extrabold text-positive mt-2.5 leading-none tracking-tight">
                <CompactAmount
                  amount={receivable}
                  currency={currency}
                  drawerTitle="You Will Receive"
                />
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
                <CompactAmount
                  amount={payable}
                  currency={currency}
                  drawerTitle="You Will Pay"
                />
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
