import type { AppContact, ContactCategory } from '../types'

// ─── Contacts to Invite ───────────────────────────────────────────────────────

export const MOCK_INVITES: AppContact[] = [
  {
    id: 'i1',
    name: 'Ayesha',
    phone: '+92 300 1234567',
    initials: 'A',
    avatarColor: 'bg-[#EFE7DD] text-[#9A9590]',
    isOnLainDain: false,
  },
  {
    id: 'i2',
    name: 'Hassan Ali',
    phone: '+92 333 9876543',
    initials: 'HA',
    avatarColor: 'bg-[#EFE7DD] text-[#9A9590]',
    isOnLainDain: false,
  },
  {
    id: 'i3',
    name: 'Kashif Jamil',
    phone: '+92 321 4455667',
    initials: 'KJ',
    avatarColor: 'bg-[#EFE7DD] text-[#9A9590]',
    isOnLainDain: false,
  },
  {
    id: 'i4',
    name: 'Nida Fatima',
    phone: '+92 345 5566778',
    initials: 'NF',
    avatarColor: 'bg-[#EFE7DD] text-[#9A9590]',
    isOnLainDain: false,
  },
  {
    id: 'i5',
    name: 'Waqas Ahmed',
    phone: '+92 312 8899001',
    initials: 'WA',
    avatarColor: 'bg-[#EFE7DD] text-[#9A9590]',
    isOnLainDain: false,
  },
  {
    id: 'i6',
    name: 'Sadia Malik',
    phone: '+92 300 9900112',
    initials: 'SM',
    avatarColor: 'bg-[#EFE7DD] text-[#9A9590]',
    isOnLainDain: false,
  },
]

// ─── Group Categories ─────────────────────────────────────────────────────────

export const MOCK_CATEGORIES: ContactCategory[] = [
  {
    id: 'cat1',
    name: 'Friend',
    description: 'Personal friend',
    icon: '👤',
    bgColor: 'bg-[#E3F2FD]',
    iconColor: 'text-[#1E3A8A]',
  },
  {
    id: 'cat2',
    name: 'Family',
    description: 'Family member',
    icon: '👥',
    bgColor: 'bg-[#FFF3E0]',
    iconColor: 'text-[#E65100]',
  },
  {
    id: 'cat3',
    name: 'Colleague',
    description: 'Work / office',
    icon: '💼',
    bgColor: 'bg-[#E8F5E9]',
    iconColor: 'text-positive',
  },
  {
    id: 'cat4',
    name: 'Roommate',
    description: 'Shared living',
    icon: '🏠',
    bgColor: 'bg-[#F3E5F5]',
    iconColor: 'text-[#4A148C]',
  },
  {
    id: 'cat5',
    name: 'Classmate',
    description: 'School / university',
    icon: '🎓',
    bgColor: 'bg-[#FFFDE7]',
    iconColor: 'text-[#F57F17]',
  },
  {
    id: 'cat6',
    name: 'Travel',
    description: 'Trips & holidays',
    icon: '✈️',
    bgColor: 'bg-[#E0F7FA]',
    iconColor: 'text-[#006064]',
  },
  {
    id: 'cat7',
    name: 'Business',
    description: 'Professional / client',
    icon: '💵',
    bgColor: 'bg-[#E8F5E9]',
    iconColor: 'text-[#1B5E20]',
  },
  {
    id: 'cat8',
    name: 'Other',
    description: 'Everything else',
    icon: '⚠️',
    bgColor: 'bg-[#ECEFF1]',
    iconColor: 'text-[#37474F]',
  },
]
