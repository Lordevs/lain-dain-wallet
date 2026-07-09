import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

/**
 * Haptic feedback utility for Lain Dain Wallet.
 *
 * All functions are safe to call on web (no-op when not native).
 *
 * Usage:
 *   import { haptic } from '@/lib/haptics'
 *
 *   haptic.light()       // Button taps, list item selections
 *   haptic.medium()      // Toggle switches, drawer opens
 *   haptic.heavy()       // Destructive actions (delete, clear)
 *   haptic.success()     // Expense saved, settle-up completed
 *   haptic.error()       // Validation failure, network error
 *   haptic.warning()     // Soft warning (e.g. approaching budget limit)
 */

const isNative = () => Capacitor.isNativePlatform()

export const haptic = {
  /** Light tap — use for: button presses, list item taps, chip selections */
  light: () => {
    if (!isNative()) return
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
  },

  /** Medium tap — use for: toggle switches, opening drawers, completing steps */
  medium: () => {
    if (!isNative()) return
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {})
  },

  /** Heavy tap — use for: delete confirmations, clearing amounts, long-press */
  heavy: () => {
    if (!isNative()) return
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {})
  },

  /** Success notification — use for: expense saved, settle-up done, category added */
  success: () => {
    if (!isNative()) return
    Haptics.notification({ type: NotificationType.Success }).catch(() => {})
  },

  /** Error notification — use for: form validation failures, network errors */
  error: () => {
    if (!isNative()) return
    Haptics.notification({ type: NotificationType.Error }).catch(() => {})
  },

  /** Warning notification — use for: budget limit warnings, soft alerts */
  warning: () => {
    if (!isNative()) return
    Haptics.notification({ type: NotificationType.Warning }).catch(() => {})
  },
}
