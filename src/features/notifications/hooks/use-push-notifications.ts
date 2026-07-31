import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { FirebaseMessaging } from '@capacitor-firebase/messaging'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/use-auth-store'
import { ROUTES } from '@/constants/routes'
import { useRegisterFcmDeviceMutation } from '../api/use-register-fcm-device-mutation'

/**
 * Registers this device for FCM push once the user is fully signed in, and
 * wires the two delivery-state listeners: foreground (toast + list
 * refresh) and tap-from-background (list refresh + navigate to the
 * notifications screen, where each card already knows how to route itself
 * — see NotificationsScreen's per-type action handling).
 *
 * No-ops entirely on web and until onboarding is complete. Registration is
 * best-effort: a permission denial or a missing native Firebase project
 * config (no google-services.json / GoogleService-Info.plist yet) must
 * never block the rest of the app — the in-app notification list works
 * over the regular REST API regardless of whether push delivery works.
 */
export function usePushNotifications() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const registerDevice = useRegisterFcmDeviceMutation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const profileComplete = useAuthStore((s) => s.userProfile?.profileComplete ?? false)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    if (!isAuthenticated || !profileComplete) return

    let cancelled = false
    const listeners: Array<Promise<{ remove: () => void }>> = []

    async function register() {
      let status = await FirebaseMessaging.checkPermissions()
      if (status.receive === 'prompt' || status.receive === 'prompt-with-rationale') {
        status = await FirebaseMessaging.requestPermissions()
      }
      if (status.receive !== 'granted' || cancelled) return

      const { token } = await FirebaseMessaging.getToken()
      if (cancelled) return
      registerDevice.mutate({
        registration_id: token,
        type: Capacitor.getPlatform() === 'ios' ? 'ios' : 'android',
        active: true,
      })
    }

    register().catch(() => {})

    listeners.push(
      FirebaseMessaging.addListener('notificationReceived', (event) => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        if (event.notification.title) {
          toast.info(event.notification.title, { description: event.notification.body })
        }
      }),
    )

    listeners.push(
      FirebaseMessaging.addListener('notificationActionPerformed', () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        router.navigate({ to: ROUTES.NOTIFICATIONS })
      }),
    )

    return () => {
      cancelled = true
      listeners.forEach((listenerPromise) => {
        listenerPromise.then((listener) => listener.remove())
      })
    }
    // registerDevice/router/queryClient are stable singletons for this
    // effect's purposes — only auth state should re-trigger registration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, profileComplete])
}
