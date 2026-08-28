import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'

interface WebKitAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext
}

let successAudioContext: AudioContext | null = null

function getSuccessAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (successAudioContext) return successAudioContext

  const AudioContextClass = window.AudioContext || (window as WebKitAudioWindow).webkitAudioContext
  if (!AudioContextClass) return null

  successAudioContext = new AudioContextClass()
  return successAudioContext
}

function unlockSuccessAudio() {
  const audioContext = getSuccessAudioContext()
  if (!audioContext || audioContext.state === 'running') return
  void audioContext.resume().catch(() => undefined)
}

// Mobile WebViews require audio to be unlocked during a user gesture. This
// module is loaded with the form, so the first tap primes the shared context
// before the async save finishes and SuccessCheck is mounted.
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', unlockSuccessAudio, { once: true, passive: true })
  document.addEventListener('keydown', unlockSuccessAudio, { once: true })
}

async function playSuccessChime() {
  const audioContext = getSuccessAudioContext()
  if (!audioContext) return

  if (audioContext.state !== 'running') {
    await audioContext.resume()
  }

  const startAt = audioContext.currentTime
  const notes = [
    { frequency: 659.25, delay: 0, duration: 0.24 },
    { frequency: 783.99, delay: 0.12, duration: 0.32 },
  ]

  notes.forEach(({ frequency, delay, duration }) => {
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    const noteStart = startAt + delay

    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(frequency, noteStart)
    gain.gain.setValueAtTime(0.28, noteStart)
    gain.gain.exponentialRampToValueAtTime(0.01, noteStart + duration)
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start(noteStart)
    oscillator.stop(noteStart + duration)
  })
}

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
  text = '',
  showConfetti = false,
}: SuccessCheckProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const soundPlayedRef = useRef(false)

  useEffect(() => {
    // The success sound is independent of the optional confetti animation.
    if (!soundPlayedRef.current) {
      soundPlayedRef.current = true
      void playSuccessChime().catch(() => undefined)
    }
  }, [])

  useEffect(() => {
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
