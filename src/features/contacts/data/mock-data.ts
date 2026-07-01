import type { AppContact, ContactCategory } from '../types'

// ─── Contacts on Lain Dain ────────────────────────────────────────────────────

export const MOCK_CONTACTS: AppContact[] = [
  {
    id: 'c1',
    name: 'Ali Hassan',
    initials: 'AH',
    avatarColor: 'bg-[#E8F5E9] text-[#0B683A]',
    isOnLainDain: true,
  },
  {
    id: 'c2',
    name: 'Sara Khan',
    initials: 'SK',
    avatarColor: 'bg-[#FFF8E1] text-[#B45309]',
    isOnLainDain: true,
  },
  {
    id: 'c3',
    name: 'Usman',
    initials: 'U',
    avatarColor: 'bg-[#E3F2FD] text-[#1E3A8A]',
    isOnLainDain: true,
  },
  {
    id: 'c4',
    name: 'Fatima Mir',
    initials: 'FM',
    avatarColor: 'bg-[#E0F2F1] text-[#00695C]',
    isOnLainDain: true,
  },
  {
    id: 'c5',
    name: 'Rameen',
    initials: 'R',
    avatarColor: 'bg-[#FCE4EC] text-[#880E4F]',
    isOnLainDain: true,
  },
  {
    id: 'c6',
    name: 'Zainab Ahmed',
    initials: 'ZA',
    avatarColor: 'bg-[#E8EAF6] text-[#283593]',
    isOnLainDain: true,
  },
  {
    id: 'c7',
    name: 'Bilal Farooq',
    initials: 'BF',
    avatarColor: 'bg-[#E0F7FA] text-[#00838F]',
    isOnLainDain: true,
  },
  {
    id: 'c8',
    name: 'Mahnoor Shah',
    initials: 'MS',
    avatarColor: 'bg-[#F3E5F5] text-[#4A148C]',
    isOnLainDain: true,
  },
  {
    id: 'c9',
    name: 'Omer Malik',
    initials: 'OM',
    avatarColor: 'bg-[#FFF3E0] text-[#E65100]',
    isOnLainDain: true,
  },
  {
    id: 'c10',
    name: 'Zoya Khan',
    initials: 'ZK',
    avatarColor: 'bg-[#E8F5E9] text-[#0F5132]',
    isOnLainDain: true,
  },
]

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
    iconColor: 'text-[#0B683A]',
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
