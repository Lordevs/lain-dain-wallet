// ─── Shared Group Members (Mock Data) ────────────────────────────────────────
// Single source of truth for the Murree Trip group members.
// Used in GroupSettingsScreen, RecurringPaymentsScreen, AddRecurringScreen.

export interface GroupMember {
  id: string
  name: string
  initials: string
  avatarColor: string
}

export const MOCK_GROUP_MEMBERS: GroupMember[] = [
  { id: 'you',    name: 'You',        initials: 'MH', avatarColor: 'bg-[#0B683A]' },
  { id: 'ali',    name: 'Ali Hassan', initials: 'AH', avatarColor: 'bg-[#2F80ED]' },
  { id: 'sara',   name: 'Sara Khan',  initials: 'SK', avatarColor: 'bg-[#C96A1B]' },
  { id: 'hassan', name: 'Hassan',     initials: 'HS', avatarColor: 'bg-[#4F5D75]' },
]

/** Resolve a member's display name from their id */
export function getMemberName(memberId: string): string {
  if (memberId === 'multiple') return 'Multiple people'
  return MOCK_GROUP_MEMBERS.find((m) => m.id === memberId)?.name ?? 'Unknown'
}
