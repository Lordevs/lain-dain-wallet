import { useCallback, useEffect, useRef, useState } from 'react'
import { App } from '@capacitor/app'
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
 * Owns the "ask once, then silently re-sync" contacts permission dance:
 * on mount, checks the OS-level permission (which the OS itself already
 * remembers across launches — no separate "have we asked before" flag
 * needed). Already-granted access re-syncs immediately and silently every
 * time this fires (e.g. whenever /contacts/new is opened), so a contact
 * added to the phone since the last visit — including one who's already
 * on Lain Dain — gets picked up without the user doing anything. Not yet
 * decided (`prompt`) surfaces a status the screen can render an explicit
 * "Allow access" CTA for, matching the OS's own consent-first expectation
 * rather than silently prompting behind the scenes.
 */
export function useDeviceContactsSync() {
  const [status, setStatus] = useState<ContactsSyncStatus>(() =>
    isDeviceContactsAvailable() ? 'checking' : 'unavailable',
  )
  const [syncError, setSyncError] = useState<string | null>(null)
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([])
  const activeSync = useRef<Promise<void> | null>(null)
  const syncMutation = useContactSyncMutation()
  const userProfile = useAuthStore((s) => s.userProfile)

  const runSync = useCallback(async () => {
    // A screen can receive an app-resume event while its initial sync is still
    // running. Reuse that work instead of sending two copies of the address
    // book to the API and racing their cache invalidations.
    if (activeSync.current) return activeSync.current

    const task = (async () => {
      setSyncError(null)
      const contacts = await getDeviceContacts((userProfile?.country as Country) || 'PK')
      // Keep the native result locally regardless of whether the optional
      // server-side Lain Dain matching step succeeds.
      setDeviceContacts(contacts)
      if (contacts.length > 0) await syncMutation.mutateAsync(contacts)
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
      const granted = await checkContactsPermission()
      if (disposed) return
      setStatus(granted ? 'granted' : 'prompt')
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
  }, [])

  const requestAccess = useCallback(async () => {
    const granted = await requestContactsPermission()
    setStatus(granted ? 'granted' : 'denied')
    if (granted) await runSync()
    return granted
  }, [runSync])

  return {
    status,
    isSyncing: syncMutation.isPending,
    syncError,
    deviceContacts,
    requestAccess,
    resync: runSync,
  }
}
