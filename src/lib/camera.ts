import { Capacitor } from '@capacitor/core'
import { Camera } from '@capacitor/camera'
import type { MediaResult } from '@capacitor/camera'

/**
 * Camera utility for Lain Dain Wallet.
 * Uses @capacitor/camera v8 API: takePhoto() + chooseFromGallery()
 *
 * Use cases:
 *  - Attach a receipt image to an expense
 *  - Set a profile photo
 *  - Attach payment proof to a settlement
 *
 * Usage:
 *   import { takePhoto, pickFromGallery } from '@/lib/camera'
 *
 *   const photo = await takePhoto()
 *   if (photo) {
 *     <img src={photo.webPath} />   // webPath is safe as an <img src>
 *   }
 */

export type AppPhoto = MediaResult

// ─── Single photo from camera ────────────────────────────────────────────────

/**
 * Open the camera to take a new photo. Returns null if user cancels.
 *
 * ⚠️ iOS Simulator has no camera — this automatically falls back to
 * the gallery picker on simulator so testing still works without crashing.
 */
export async function takePhoto(): Promise<MediaResult | null> {
  // iOS Simulator has no camera hardware — fall back to gallery
  if (isIOSSimulator()) {
    console.warn('[Camera] iOS Simulator detected — falling back to gallery picker')
    return pickFromGallery()
  }

  try {
    const result = await Camera.takePhoto({ quality: 85 })
    return result
  } catch (err: unknown) {
    if (isCancelError(err)) return null
    console.error('[Camera] takePhoto error:', err)
    return null
  }
}

// ─── Pick from gallery ───────────────────────────────────────────────────────

/** Open the gallery to pick a single photo. Returns null if user cancels. */
export async function pickFromGallery(): Promise<MediaResult | null> {
  try {
    // chooseFromGallery returns MediaResults with a `results` array (v8)
    const { results } = await Camera.chooseFromGallery({
      quality: 85,
      allowMultipleSelection: false,
    })
    return results[0] ?? null
  } catch (err: unknown) {
    if (isCancelError(err)) return null
    console.error('[Camera] pickFromGallery error:', err)
    return null
  }
}

/** Open the gallery to pick multiple photos (e.g. multiple receipt images). */
export async function pickMultipleFromGallery(limit = 5): Promise<MediaResult[]> {
  try {
    const { results } = await Camera.chooseFromGallery({
      quality: 85,
      allowMultipleSelection: true,
      limit,
    })
    return results
  } catch (err: unknown) {
    if (isCancelError(err)) return []
    console.error('[Camera] pickMultipleFromGallery error:', err)
    return []
  }
}

// ─── Permissions ─────────────────────────────────────────────────────────────

/**
 * Request camera + photo library permissions.
 * Call before showing camera UI so the prompt appears at a natural moment.
 */
export async function requestCameraPermissions(): Promise<boolean> {
  try {
    const status = await Camera.requestPermissions({ permissions: ['camera', 'photos'] })
    return status.camera === 'granted' && status.photos !== 'denied'
  } catch {
    return false
  }
}

/** Check current permission status without prompting. */
export async function checkCameraPermissions() {
  try {
    return await Camera.checkPermissions()
  } catch {
    return null
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Whether we're running on a real native device */
export const isCameraAvailable = () => Capacitor.isNativePlatform()

/** Normalise cancel/dismiss errors so callers don't need to handle them */
function isCancelError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : err
  const msg = String(message ?? '').toLowerCase()
  return (
    msg.includes('cancel') ||
    msg.includes('dismiss') ||
    msg.includes('no image') ||
    msg.includes('user denied')
  )
}

/**
 * Detect iOS Simulator — it has no camera hardware.
 * Apple injects "Simulator" into the userAgent on simulator builds.
 */
function isIOSSimulator(): boolean {
  return (
    Capacitor.getPlatform() === 'ios' &&
    /simulator/i.test(navigator.userAgent)
  )
}
