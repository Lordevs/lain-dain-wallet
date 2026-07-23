// Shared by any feature that renders a real person/group name where the
// backend has no avatarColor/initials of its own (it never does — those
// are purely a frontend presentational concept). A fixed, deliberately
// varied palette (not derived from the design system's single accent) so
// a list of real contacts doesn't all render as the same color the way a
// single default would.
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

export function colorForName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

export function initialsForName(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)
  return initials || '?'
}
