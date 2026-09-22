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

export type ContactsSyncStatus = 'unavailable' | 'checking' | 'prompt' | 'declined' | 'denied' | 'granted'

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
  const syncMutation = useContactSyncMutation()
  const userProfile = useAuthStore((s) => s.userProfile)
  const consentKey = userProfile?.id ? `contacts-upload-consent-v1:${userProfile.id}` : null
  const consentGranted = useRef(false)
  const declinedThisVisit = useRef(false)

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
    const syncWhenAllowed = async () => {
      if (!consentKey) return
      const { value } = await Preferences.get({ key: consentKey })
      if (disposed) return
      consentGranted.current = value === 'granted'
      if (!consentGranted.current) {
        setStatus(declinedThisVisit.current ? 'declined' : 'prompt')
        return
      }
      const granted = await checkContactsPermission()
      if (disposed) return
      setStatus(granted ? 'granted' : 'denied')
      if (granted) await runSync()
    }

    void syncWhenAllowed()

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
    const granted = await requestContactsPermission()
    setStatus(granted ? 'granted' : 'denied')
    if (granted) {
      await Preferences.set({ key: consentKey, value: 'granted' })
      consentGranted.current = true
      await runSync()
    }
    return granted
  }, [consentKey, runSync])

  const declineAccess = useCallback(() => {
    consentGranted.current = false
    declinedThisVisit.current = true
    setStatus('declined')
  }, [])
  const showConsent = useCallback(() => {
    declinedThisVisit.current = false
    setStatus('prompt')
  }, [])

  return {
    status,
    isSyncing: isReadingContacts || syncMutation.isPending,
    syncError,
    deviceContacts,
    requestAccess,
    declineAccess,
    showConsent,
    resync: runSync,
  }
}
