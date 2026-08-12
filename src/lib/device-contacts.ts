import { Capacitor } from '@capacitor/core'
import { Contacts } from '@capacitor-community/contacts'
import type { Country } from 'react-phone-number-input'

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

function cleanDisplayName(rawName: string | null | undefined, phoneNumber: string): string {
  const printableName = [...(rawName ?? '')]
    .map((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      return codePoint < 32 || codePoint === 127 ? ' ' : character
    })
    .join('')
  const normalized = printableName
    // Native address books can contain line breaks/control characters copied
    // from vCards. They break row layout and make initials look corrupted.
    .replace(/\s+/g, ' ')
    .trim()

  // Names containing no letters or digits (".", "-", etc.) are common in
  // imported iOS contacts. A readable phone fallback is more useful and
  // keeps avatar generation deterministic.
  return /[\p{L}\p{N}]/u.test(normalized)
    ? normalized.slice(0, 150)
    : phoneNumber
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

  // iOS commonly exposes the same number more than once when another app
  // adds a custom-labelled entry (for example "mobile" + "X-WhatsApp").
  // The sync endpoint treats phone_number as unique for an owner, so sending
  // both copies in one batch can fail the entire request.
  const resultsByPhone = new Map<string, DeviceContact>()
  for (const contact of contacts) {
    for (const phone of contact.phones ?? []) {
      if (!phone.number) continue
      const e164 = await toE164(phone.number, defaultCountry)
      if (e164 && !resultsByPhone.has(e164)) {
        resultsByPhone.set(e164, {
          // Match ContactSyncItemSerializer's max_length so an unusually long
          // device-contact name cannot invalidate the whole upload.
          displayName: cleanDisplayName(contact.name?.display, e164),
          phoneNumber: e164,
        })
      }
    }
  }
  return [...resultsByPhone.values()]
}

// libphonenumber (197KB via react-phone-number-input) is only needed once
// a real device-contacts sync runs — dynamic-importing it here keeps it
// out of the new-contact route's own bundle, which otherwise paid for it
// on every visit regardless of whether the user ever taps "sync contacts."
async function toE164(rawNumber: string, defaultCountry: Country): Promise<string | null> {
  try {
    const { parsePhoneNumber } = await import('react-phone-number-input')
    const parsed = parsePhoneNumber(rawNumber, defaultCountry)
    return parsed?.isValid() ? parsed.number : null
  } catch {
    return null
  }
}
