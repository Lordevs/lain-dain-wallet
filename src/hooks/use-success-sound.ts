import { useEffect, useRef } from 'react'
import successSoundUrl from '../../assets/sounds/simple-done-effect.mp3'
import confettiSoundUrl from '../../assets/sounds/confetti.wav'

export type SuccessSoundVariant = 'default' | 'confetti'

const soundUrls: Record<SuccessSoundVariant, string> = {
  default: successSoundUrl,
  confetti: confettiSoundUrl,
}
const sounds = new Map<SuccessSoundVariant, HTMLAudioElement>()

function getSuccessSound(variant: SuccessSoundVariant) {
  const existing = sounds.get(variant)
  if (existing) return existing

  const audio = new Audio(soundUrls[variant])
  audio.preload = 'auto'
  sounds.set(variant, audio)
  return audio
}

function unlockSuccessSound() {
  ;(['default', 'confetti'] as const).forEach((variant) => {
    const audio = getSuccessSound(variant)
    audio.muted = true
    void audio.play().then(() => {
      audio.pause()
      audio.currentTime = 0
      audio.muted = false
    }).catch(() => undefined)
  })
}

// Prime playback during a gesture so the sound remains available after the
// asynchronous create request redirects to its success screen.
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', unlockSuccessSound, { once: true, passive: true })
  document.addEventListener('keydown', unlockSuccessSound, { once: true })
}

export function useSuccessSound(variant: SuccessSoundVariant = 'default') {
  const playedRef = useRef(false)

  useEffect(() => {
    if (playedRef.current) return
    playedRef.current = true

    const audio = getSuccessSound(variant)
    audio.pause()
    audio.currentTime = 0
    audio.muted = false
    void audio.play().catch(() => undefined)
  }, [variant])
}
