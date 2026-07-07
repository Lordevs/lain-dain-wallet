import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'

interface SuccessCheckProps {
  onComplete: () => void
  text?: string
  showConfetti?: boolean
}

interface ConfettiPiece {
  x: number
  y: number
  size: number
  color: string
  speedX: number
  speedY: number
  rotation: number
  rotationSpeed: number
}

const CONFETTI_COLORS = [
  '#22D18B',
  '#FDB105',
  '#FD79A8',
  '#4ECDC4',
  '#A29BFE',
  '#FF6B6B',
]

export default function SuccessCheck({
  onComplete,
  text = 'Success',
  showConfetti = false,
}: SuccessCheckProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Play success chime sound for celebration checks
    if (showConfetti) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass()

          audioCtx.resume().then(() => {
            // Chime Note 1 (E5)
            const osc1 = audioCtx.createOscillator()
            const gain1 = audioCtx.createGain()
            osc1.type = 'triangle'
            osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime) // E5
            gain1.gain.setValueAtTime(0.35, audioCtx.currentTime) // Louder chime volume
            gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3)
            osc1.connect(gain1)
            gain1.connect(audioCtx.destination)
            osc1.start()
            osc1.stop(audioCtx.currentTime + 0.3)
          }).catch(() => {
            // ignore resume rejection
          })
        }
      } catch (err) {
        // Ignore autoplay blocking error
      }
    }

    const duration = showConfetti ? 2800 : 500
    const timer = setTimeout(() => {
      onComplete()
    }, duration)
    return () => clearTimeout(timer)
  }, [onComplete, showConfetti])

  useEffect(() => {
    if (!showConfetti) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Fit canvas to display bounds
    let animationId: number
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Generate confetti pieces
    const pieces: ConfettiPiece[] = []
    const pieceCount = 60

    for (let i = 0; i < pieceCount; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height - 20, // Start above viewport
        size: Math.random() * 6 + 4,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        speedX: Math.random() * 3 - 1.5,
        speedY: Math.random() * 3 + 3, // Balanced initial fall speed
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 3 - 1.5,
      })
    }

    // Animation loop
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      pieces.forEach((p) => {
        // Balanced gravity acceleration
        p.speedY = Math.min(8, p.speedY + 0.035)
        p.y += p.speedY
        p.x += p.speedX
        p.rotation += p.rotationSpeed

        // Wrap or reset piece to top when it falls past screen bottom
        if (p.y > canvas.height) {
          p.y = -20
          p.x = Math.random() * canvas.width
          p.speedY = Math.random() * 3 + 3 // Reset fall speed on wrap
        }

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color

        // Randomize shape aspect (rectangle ribbon vs square)
        ctx.fillRect(-p.size / 2, -p.size, p.size, p.size * 1.5)
        ctx.restore()
      })

      animationId = requestAnimationFrame(tick)
    }

    tick()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [showConfetti])

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative w-full h-full overflow-hidden select-none bg-[#FEFAF1]">
      {/* Canvas background for smooth confetti overlay (only rendered if active) */}
      {showConfetti && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />
      )}

      <div className="flex flex-col items-center z-10">
        {/* Animated Check Bubble */}
        <div
          className="w-28 h-28 rounded-full bg-[#E4F2EB] shadow-[0px_6px_24px_0px_#0B683A33] flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
          onClick={onComplete}
        >
          <Check size={44} className="text-positive" strokeWidth={3} />
        </div>

        {/* Dynamic Success Label */}
        <span className="text-[22px] font-black text-[#1A1A1A] mt-6 tracking-tight animate-fade-in text-center leading-none">
          {text}
        </span>
      </div>
    </div>
  )
}
