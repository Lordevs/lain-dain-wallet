import { useCallback, useEffect, useState } from 'react'
import type { Country } from 'react-phone-number-input'
import {
  checkContactsPermission,
  getDeviceContacts,
  isDeviceContactsAvailable,
  requestContactsPermission,
} from '@/lib/device-contacts'
import { useContactSyncMutation } from '@/features/contacts/api/use-contact-sync-mutation'
import { useAuthStore } from '@/store/use-auth-store'

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
  const syncMutation = useContactSyncMutation()
  const userProfile = useAuthStore((s) => s.userProfile)

  const runSync = useCallback(async () => {
    const contacts = await getDeviceContacts((userProfile?.country as Country) || 'PK')
    if (contacts.length > 0) await syncMutation.mutateAsync(contacts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.country])

  useEffect(() => {
    if (!isDeviceContactsAvailable()) return
    checkContactsPermission().then((granted) => {
      if (granted) {
        setStatus('granted')
        runSync()
      } else {
        setStatus('prompt')
      }
    })
    // Only on mount — re-checking is explicit (requestAccess / a fresh
    // screen mount), not tied to runSync's identity changing.
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
    requestAccess,
    resync: runSync,
  }
}
