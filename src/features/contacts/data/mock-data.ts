import type { ContactCategory } from '../types'

// ─── Group Categories ─────────────────────────────────────────────────────────
// ids match apps.ledger.models.GroupCategory's values exactly (see
// GroupSerializer.category / CategoryEnum) — these go straight into
// POST /api/ledger/groups/, no translation table needed.

export const MOCK_CATEGORIES: ContactCategory[] = [
  {
    id: 'friends',
    name: 'Friend',
    description: 'Personal friend',
    icon: '👤',
    bgColor: 'bg-[#E3F2FD]',
    iconColor: 'text-[#1E3A8A]',
  },
  {
    id: 'family',
    name: 'Family',
    description: 'Family member',
    icon: '👥',
    bgColor: 'bg-[#FFF3E0]',
    iconColor: 'text-[#E65100]',
  },
  {
    id: 'colleague',
    name: 'Colleague',
    description: 'Work / office',
    icon: '💼',
    bgColor: 'bg-[#E8F5E9]',
    iconColor: 'text-positive',
  },
  {
    id: 'roommate',
    name: 'Roommate',
    description: 'Shared living',
    icon: '🏠',
    bgColor: 'bg-[#F3E5F5]',
    iconColor: 'text-[#4A148C]',
  },
  {
    id: 'classmate',
    name: 'Classmate',
    description: 'School / university',
    icon: '🎓',
    bgColor: 'bg-[#FFFDE7]',
    iconColor: 'text-[#F57F17]',
  },
  {
    id: 'travel',
    name: 'Travel',
    description: 'Trips & holidays',
    icon: '✈️',
    bgColor: 'bg-[#E0F7FA]',
    iconColor: 'text-[#006064]',
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Professional / client',
    icon: '💵',
    bgColor: 'bg-[#E8F5E9]',
    iconColor: 'text-[#1B5E20]',
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Everything else',
    icon: '⚠️',
    bgColor: 'bg-[#ECEFF1]',
    iconColor: 'text-[#37474F]',
  },
]
