import { Capacitor } from '@capacitor/core'
import { Contacts } from '@capacitor-community/contacts'
import { parsePhoneNumber, type Country } from 'react-phone-number-input'

/**
 * Reads the device address book (native only) and normalizes each phone
 * number to E.164 — the same format apps/contacts.PhoneNumberField expects
 * server-side, so ContactSyncView's `owner`+`phone_number` uniqueness
 * actually dedupes correctly instead of storing the same person twice
 * under a local-format and an E.164-format number.
 */
export interface DeviceContact {
  displayName: string
  phoneNumber: string // E.164
}

/** Only real native builds can read the address book — there's no browser
 * equivalent, and this app only ships as a Capacitor native app anyway
 * (see secure-storage.ts). */
export const isDeviceContactsAvailable = () => Capacitor.isNativePlatform()

export async function checkContactsPermission(): Promise<boolean> {
  if (!isDeviceContactsAvailable()) return false
  try {
    const status = await Contacts.checkPermissions()
    return status.contacts === 'granted' || status.contacts === 'limited'
  } catch {
    return false
  }
}

export async function requestContactsPermission(): Promise<boolean> {
  if (!isDeviceContactsAvailable()) return false
  try {
    const status = await Contacts.requestPermissions()
    return status.contacts === 'granted' || status.contacts === 'limited'
  } catch {
    return false
  }
}

/**
 * Reads every device contact with at least one phone number, flattening
 * multi-number contacts into one DeviceContact per number (each becomes
 * its own synced row — matches ContactSyncItemSerializer's flat shape).
 * `defaultCountry` resolves numbers dialled in local format (no country
 * code) — pass the signed-in user's own country so "0321 1234567" parses
 * the way they'd expect, falling back to Pakistan since that's this app's
 * primary market.
 */
export async function getDeviceContacts(defaultCountry: Country = 'PK'): Promise<DeviceContact[]> {
  if (!isDeviceContactsAvailable()) return []

  const { contacts } = await Contacts.getContacts({
    projection: { name: true, phones: true },
  })

  const results: DeviceContact[] = []
  for (const contact of contacts) {
    const displayName = contact.name?.display?.trim()
    if (!displayName) continue

    for (const phone of contact.phones ?? []) {
      if (!phone.number) continue
      const e164 = toE164(phone.number, defaultCountry)
      if (e164) results.push({ displayName, phoneNumber: e164 })
    }
  }
  return results
}

function toE164(rawNumber: string, defaultCountry: Country): string | null {
  try {
    const parsed = parsePhoneNumber(rawNumber, defaultCountry)
    return parsed?.isValid() ? parsed.number : null
  } catch {
    return null
  }
}
