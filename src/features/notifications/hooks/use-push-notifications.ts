import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { FirebaseMessaging, Importance, Visibility } from '@capacitor-firebase/messaging'
import { App } from '@capacitor/app'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useAuthStore } from '@/store/use-auth-store'
import { ROUTES } from '@/constants/routes'
import { useRegisterFcmDeviceMutation } from '../api/use-register-fcm-device-mutation'
import { toast } from 'sonner'
import { clearRefreshToken } from '@/lib/secure-storage'
import { apiClient } from '@/lib/api/client'
import notificationSoundUrl from '../../../../assets/sounds/notification-effect.mp3'

let isHandlingSessionRevocation = false
let notificationSound: HTMLAudioElement | undefined

function playNotificationSound() {
  notificationSound ??= new Audio(notificationSoundUrl)
  notificationSound.currentTime = 0
  void notificationSound.play().catch(() => undefined)
}

async function handleSessionRevoked(router: ReturnType<typeof useRouter>, queryClient: ReturnType<typeof useQueryClient>) {
  if (isHandlingSessionRevocation) return
  isHandlingSessionRevocation = true
  await clearRefreshToken()
  queryClient.clear()
  useAuthStore.getState().logout()
  toast.error('You were logged out', {
    description: 'Your account was signed in on another device.',
  })
  await router.navigate({ to: ROUTES.AUTH })
  isHandlingSessionRevocation = false
}

const GROUP_ACTIVITY_TYPES = new Set([
  'group_created',
  'group_members_invited',
  'group_member_joined',
  'group_expense_added',
])

const ANDROID_NOTIFICATION_CHANNEL_ID = 'lain_dain_notifications_v1'

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

    async function registerToken(token: string) {
      await registerDevice.mutateAsync({
        registration_id: token,
        type: Capacitor.getPlatform() === 'ios' ? 'ios' : 'android',
        active: true,
      })
    }

    async function register() {
      let status = await FirebaseMessaging.checkPermissions()
      if (status.receive === 'prompt' || status.receive === 'prompt-with-rationale') {
        status = await FirebaseMessaging.requestPermissions()
      }
      if (status.receive !== 'granted' || cancelled) return

      if (Capacitor.getPlatform() === 'android') {
        await FirebaseMessaging.createChannel({
          id: ANDROID_NOTIFICATION_CHANNEL_ID,
          name: 'Lain Dain notifications',
          description: 'Payment alerts, reminders, and group invitations',
          importance: Importance.High,
          sound: 'notification_effect.mp3',
          vibration: true,
          visibility: Visibility.Private,
        })
      }

      const { token } = await FirebaseMessaging.getToken()
      if (cancelled) return
      await registerToken(token)
    }

    register().catch((error) => {
      toast.error('Could not enable notifications', {
        description: error instanceof Error ? error.message : 'Please try again from Settings.',
      })
    })

    // FCM can rotate Android registration tokens after restore, reinstall,
    // or security maintenance. Keep the backend destination current rather
    // than waiting for another login cycle.
    listeners.push(
      FirebaseMessaging.addListener('tokenReceived', ({ token }) => {
        if (cancelled) return
        registerToken(token).catch(() => {
          toast.error('Could not update this device’s notification registration.')
        })
      }),
    )

    listeners.push(
      FirebaseMessaging.addListener('notificationReceived', (event) => {
        const data = event.notification.data as Record<string, unknown> | undefined
        const type = String(data?.type ?? '')
        if (type === 'session_revoked') {
          handleSessionRevoked(router, queryClient)
          return
        }
        playNotificationSound()
        toast.info(event.notification.title || 'Lain Dain', {
          description: event.notification.body,
        })
        if (!GROUP_ACTIVITY_TYPES.has(type)) {
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }
      }),
    )

    listeners.push(
      FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
        const data = event.notification.data as Record<string, unknown> | undefined
        const type = String(data?.type ?? '')
        const groupId = data?.group_id
        const expenseId = data?.expense_id
        if (type === 'session_revoked') {
          handleSessionRevoked(router, queryClient)
          return
        }
        if ((type === 'expense_added' || type === 'expense_edited') && typeof expenseId === 'string') {
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          router.navigate({ to: ROUTES.TRANSACTION_DETAILS, params: { id: expenseId } })
          return
        }
        if (GROUP_ACTIVITY_TYPES.has(type) && typeof groupId === 'string') {
          router.navigate({ to: ROUTES.GROUP_DETAILS, params: { id: groupId } })
          return
        }
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        router.navigate({ to: ROUTES.NOTIFICATIONS })
      }),
    )

    // Push is the instant path. This foreground validation is the reliable
    // recovery path when notifications were denied, delayed, or the app was
    // suspended by the OS during the takeover.
    listeners.push(
      App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive || cancelled) return
        apiClient.GET('/api/auth/profile/').catch(() => {})
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
