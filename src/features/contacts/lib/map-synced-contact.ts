import type { components } from '@/lib/api/schema'
import type { Contact } from '@/store/use-contact-store'

// A fixed, deliberately varied palette (not derived from the design
// system's single accent) so a list of real synced contacts doesn't all
// render as the same color the way a single default would.
const AVATAR_PALETTE = [
  'bg-[#E3F2FD] text-[#1E3A8A]',
  'bg-[#FFF3E0] text-[#E65100]',
  'bg-[#E8F5E9] text-positive',
  'bg-[#F3E5F5] text-[#4A148C]',
  'bg-[#FFFDE7] text-[#F57F17]',
  'bg-[#E0F7FA] text-[#006064]',
  'bg-[#FCE4EC] text-[#880E4F]',
  'bg-[#E8EAF6] text-[#283593]',
]

function colorForName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

function initialsForName(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)
  return initials || '?'
}

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
