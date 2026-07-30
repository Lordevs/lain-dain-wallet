import type { components } from '@/lib/api/schema'
import type { Contact } from '@/store/use-contact-store'
import { colorForName, initialsForName } from '@/lib/avatar-visuals'

/**
 * Maps a synced backend Contact (apps.contacts.Contact + its live
 * is_on_lain_dain/lain_dain_user_id annotation) into the app's canonical
 * `Contact` shape, so the existing list/selection UI (ChoiceStep,
 * AddMembersStep, SelectedMembersStrip, GroupSuccessStep) can keep working
 * unchanged against real data instead of the zustand mock store.
 *
 * `id` is the friend's real `lain_dain_user_id` whenever they're on the
 * app — every downstream action (POST /api/ledger/friendships/, group
 * member_ids) needs that real User id, never this Contact row's own id.
 * Falls back to the address-book row's own id only for not-yet-on-the-app
 * entries, which are never selectable for a friendship/group anyway.
 */
export function mapSyncedContact(c: components['schemas']['Contact']): Contact {
  const id = c.is_on_lain_dain && c.lain_dain_user_id ? c.lain_dain_user_id : c.id
  return {
    id,
    name: c.display_name,
    initials: initialsForName(c.display_name),
    avatarColor: colorForName(c.display_name),
    ledgerCount: 0,
    netAmount: 0,
    tags: [],
    isOnLainDain: c.is_on_lain_dain,
    phone: c.phone_number,
    type: 'person',
  }
}

export function mapSyncedContactToContactInfo(c: components['schemas']['Contact']) {
  const id = c.is_on_lain_dain && c.lain_dain_user_id ? c.lain_dain_user_id : c.id
  return {
    id,
    name: c.display_name,
    initials: initialsForName(c.display_name),
    avatarColor: colorForName(c.display_name),
  }
}
