import type { components } from '@/lib/api/schema'

type Group = components['schemas']['Group']

/**
 * Resolves a member's effective role against a group. Falls back to
 * `created_by` matching only when no member has been assigned the
 * `owner` role yet (groups created before ownership transfer existed) —
 * see apps/ledger/services.py::transfer_ownership. Once any member has
 * `role === 'owner'`, that's authoritative and `created_by` is ignored,
 * so a transferred-to owner is recognized correctly.
 */
export function resolveGroupRole(group: Group | undefined, userId: string): 'owner' | 'admin' | 'member' {
  if (!group || !userId) return 'member'
  const hasOwnerRole = group.members.some((m) => m.role === 'owner')
  const member = group.members.find((m) => m.id === userId)
  const isOwner = hasOwnerRole ? member?.role === 'owner' : group.created_by === userId
  if (isOwner) return 'owner'
  if (member?.role === 'admin') return 'admin'
  return 'member'
}

export interface GroupPermissions {
  role: 'owner' | 'admin' | 'member'
  isOwner: boolean
  isAdmin: boolean
}

/** Single source of truth for "can this user manage this group" — every
 * group settings/admin screen should read isOwner/isAdmin from here
 * instead of re-deriving the owner/admin fallback logic locally. */
export function getGroupPermissions(group: Group | undefined, userId: string): GroupPermissions {
  const role = resolveGroupRole(group, userId)
  return { role, isOwner: role === 'owner', isAdmin: role !== 'member' }
}
