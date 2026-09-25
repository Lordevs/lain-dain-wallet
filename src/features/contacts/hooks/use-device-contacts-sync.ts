import { useCallback, useEffect, useRef, useState } from 'react'
import { App } from '@capacitor/app'
import { Preferences } from '@capacitor/preferences'
import type { Country } from 'react-phone-number-input'
import {
  checkContactsPermission,
  getDeviceContacts,
  isDeviceContactsAvailable,
  requestContactsPermission,
  type DeviceContact,
} from '@/lib/device-contacts'
import { useContactSyncMutation } from '@/features/contacts/api/use-contact-sync-mutation'
import { useAuthStore } from '@/store/use-auth-store'
import { logError } from '@/lib/log-error'

export type ContactsSyncStatus = 'unavailable' | 'checking' | 'prompt' | 'denied' | 'granted'

/**
 * A separate, account-scoped upload consent gates every device read and sync,
 * including mount, app resume, and manual retry. OS permission alone is not
 * consent to send names and phone numbers to our server.
 */
export function useDeviceContactsSync() {
  const [status, setStatus] = useState<ContactsSyncStatus>(() =>
    isDeviceContactsAvailable() ? 'checking' : 'unavailable',
  )
  const [syncError, setSyncError] = useState<string | null>(null)
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([])
  const [isReadingContacts, setIsReadingContacts] = useState(false)
  const activeSync = useRef<Promise<void> | null>(null)
  const initialPermissionRequest = useRef<Promise<boolean> | null>(null)
  const syncMutation = useContactSyncMutation()
  const userProfile = useAuthStore((s) => s.userProfile)
  const consentKey = userProfile?.id ? `contacts-upload-consent-v1:${userProfile.id}` : null
  const consentGranted = useRef(false)

  const runSync = useCallback(async () => {
    if (!consentGranted.current) return
    // A screen can receive an app-resume event while its initial sync is still
    // running. Reuse that work instead of sending two copies of the address
    // book to the API and racing their cache invalidations.
    if (activeSync.current) return activeSync.current

    const task = (async () => {
      setSyncError(null)
      setIsReadingContacts(true)
      try {
        const contacts = await getDeviceContacts((userProfile?.country as Country) || 'PK')
        // Keep the native result locally regardless of whether the optional
        // server-side Lain Dain matching step succeeds.
        setDeviceContacts(contacts)
        if (contacts.length > 0) await syncMutation.mutateAsync(contacts)
      } finally {
        setIsReadingContacts(false)
      }
    })()
    activeSync.current = task
    try {
      await task
    } catch (error) {
      logError(error)
      setSyncError("We couldn't match contacts with Lain Dain right now. Your device contacts are still available to invite.")
    } finally {
      activeSync.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.country])

  useEffect(() => {
    if (!isDeviceContactsAvailable()) return
    let disposed = false
    const continueAfterPermission = async (granted: boolean) => {
      if (disposed) return
      if (!granted) {
        setStatus('denied')
        return
      }
      if (!consentKey) return
      const { value } = await Preferences.get({ key: consentKey })
      if (disposed) return
      consentGranted.current = value === 'granted'
      if (!consentGranted.current) {
        setStatus('prompt')
        return
      }
      setStatus('granted')
      await runSync()
    }
    const requestInitialPermission = async () => {
      // The system prompt is the first permission UI shown on this route.
      // Reuse the promise because React Strict Mode may run this effect twice
      // during development while the native request is still in flight.
      initialPermissionRequest.current ??= requestContactsPermission()
      await continueAfterPermission(await initialPermissionRequest.current)
    }
    const syncWhenAllowed = async () => {
      await continueAfterPermission(await checkContactsPermission())
    }

    void requestInitialPermission()

    // Adding a contact takes the user to the system Contacts app. This route
    // remains mounted while Lain Dain is backgrounded, so a mount-only effect
    // never saw that new contact. Refresh every time the native app becomes
    // active again (also picks up permission changes made in Settings).
    let removeAppListener: (() => Promise<void>) | undefined
    void App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void syncWhenAllowed()
    }).then((handle) => {
      if (disposed) void handle.remove()
      else removeAppListener = () => handle.remove()
    })

    return () => {
      disposed = true
      if (removeAppListener) void removeAppListener()
    }
    // Register the lifecycle listener once; runSync changing must not create
    // duplicate resume listeners.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consentKey, runSync])

  const requestAccess = useCallback(async () => {
    if (!consentKey) return false
    // Native contacts access has already been granted before this consent
    // dialog is shown. This action records consent to upload contacts for
    // matching, then starts the first sync.
    await Preferences.set({ key: consentKey, value: 'granted' })
    consentGranted.current = true
    setStatus('granted')
    await runSync()
    return true
  }, [consentKey, runSync])

  return {
    status,
    isSyncing: isReadingContacts || syncMutation.isPending,
    syncError,
    deviceContacts,
    requestAccess,
    resync: runSync,
  }
}
