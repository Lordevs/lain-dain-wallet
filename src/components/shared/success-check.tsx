import { useEffect } from 'react'
import { Check } from 'lucide-react'

interface SuccessCheckProps {
  onComplete: () => void
}

export default function SuccessCheck({ onComplete }: SuccessCheckProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, 800)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div
        className="w-32 h-32 rounded-full bg-[#DCEFE4] shadow-[0px_8.68px_34.74px_0px_#0B683A33] flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
        onClick={onComplete}
      >
        <Check size={48} className="text-[#0B683A]" strokeWidth={3} />
      </div>
    </div>
  )
}
