import { create } from 'zustand'
import type { Contact, LedgerTag, BalanceSummary } from '@/types'

// Re-exported for existing consumers that import the type from this store;
// the canonical definition lives in `@/types`.
export type { Contact, LedgerTag }

interface ContactState {
  contacts: Contact[]
  hiddenLedgerIds: string[]
  resetDay: number
  budgetLimit: number
  alertNearingLimit: boolean
  alertThreshold: number
  categoryBudgets: Record<string, number>
  addContact: (contact: Contact) => void
  updateContact: (id: string, updatedFields: Partial<Contact>) => void
  deleteContact: (id: string) => void
  setHiddenLedgerIds: (ids: string[]) => void
  setResetDay: (day: number) => void
  setBudgetLimit: (limit: number) => void
  setAlertNearingLimit: (val: boolean) => void
  setAlertThreshold: (threshold: number) => void
  setCategoryBudget: (catId: string, limit: number) => void
}

const INITIAL_CONTACTS: Contact[] = [
  // Receivables
  {
    id: '1',
    name: 'Ali Hassan',
    initials: 'AH',
    avatarColor: 'bg-[#E8F5E9] text-positive',
    ledgerCount: 3,
    netAmount: 7500,
    isOnline: true,
    isOnLainDain: true,
    type: 'person',
    tags: [
      { name: 'Personal', amount: 6000 },
      { name: 'Murree Trip Group', amount: 2000 },
      { name: 'Poker Group', amount: -500 },
    ],
  },
  {
    id: '2',
    name: 'Sara Khan',
    initials: 'SK',
    avatarColor: 'bg-[#FFF8E1] text-[#B45309]',
    ledgerCount: 2,
    netAmount: 2650,
    isOnline: true,
    isOnLainDain: true,
    type: 'person',
    tags: [
      { name: 'Personal', amount: 2850 },
      { name: 'Grocery', amount: -200 },
      { name: 'Grocery', amount: 350 },
    ],
  },
  {
    id: '3',
    name: 'Family',
    initials: '👨‍👩‍👦',
    avatarColor: 'bg-[#FFF3E0]',
    ledgerCount: 2,
    netAmount: 2450,
    isOnline: false,
    type: 'group',
    tags: [
      { name: 'Eid', amount: 1200 },
      { name: 'Groceries', amount: 1250 },
    ],
  },
  {
    id: '5',
    name: 'Murree Trip',
    initials: '🏕️',
    avatarColor: 'bg-[#E8F5E9]',
    ledgerCount: 6,
    netAmount: 6000,
    isOnline: false,
    type: 'group',
    tags: [
      { name: 'Hotel Booking', amount: 3000 },
      { name: 'Fuel', amount: 1250 },
      { name: 'Payment settled', amount: 1000 },
      { name: 'Dinner', amount: 850 },
      { name: 'Snacks', amount: 300 },
      { name: 'Motorway Toll', amount: 200 },
      { name: 'Breakfast', amount: 550 },
    ],
  },
  // Payables
  {
    id: '4',
    name: 'Hamza Ali',
    initials: 'HA',
    avatarColor: 'bg-[#E3F2FD] text-[#1E3A8A]',
    ledgerCount: 2,
    netAmount: -1800,
    isOnline: true,
    isOnLainDain: true,
    type: 'person',
    tags: [
      { name: 'Murree', amount: -2000 },
      { name: 'Groceries', amount: 200 },
    ],
  },
  // Other Contacts on Lain Dain
  {
    id: 'c3',
    name: 'Usman',
    initials: 'U',
    avatarColor: 'bg-[#E3F2FD] text-[#1E3A8A]',
    ledgerCount: 0,
    netAmount: 0,
    tags: [],
    isOnLainDain: true,
    type: 'person',
  },
  {
    id: 'c4',
    name: 'Fatima Mir',
    initials: 'FM',
    avatarColor: 'bg-[#E0F2F1] text-[#00695C]',
    ledgerCount: 0,
    netAmount: 0,
    tags: [],
    isOnLainDain: true,
    type: 'person',
  },
  {
    id: 'c5',
    name: 'Rameen',
    initials: 'R',
    avatarColor: 'bg-[#FCE4EC] text-[#880E4F]',
    ledgerCount: 0,
    netAmount: 0,
    tags: [],
    isOnLainDain: true,
    type: 'person',
  },
  {
    id: 'c6',
    name: 'Zainab Ahmed',
    initials: 'ZA',
    avatarColor: 'bg-[#E8EAF6] text-[#283593]',
    ledgerCount: 0,
    netAmount: 0,
    tags: [],
    isOnLainDain: true,
    type: 'person',
  },
  {
    id: 'c7',
    name: 'Bilal Farooq',
    initials: 'BF',
    avatarColor: 'bg-[#E0F7FA] text-[#00838F]',
    ledgerCount: 0,
    netAmount: 0,
    tags: [],
    isOnLainDain: true,
    type: 'person',
  },
  {
    id: 'c8',
    name: 'Mahnoor Shah',
    initials: 'MS',
    avatarColor: 'bg-[#F3E5F5] text-[#4A148C]',
    ledgerCount: 0,
    netAmount: 0,
    tags: [],
    isOnLainDain: true,
    type: 'person',
  },
  {
    id: 'c9',
    name: 'Omer Malik',
    initials: 'OM',
    avatarColor: 'bg-[#FFF3E0] text-[#E65100]',
    ledgerCount: 0,
    netAmount: 0,
    tags: [],
    isOnLainDain: true,
    type: 'person',
  },
  {
    id: 'c10',
    name: 'Zoya Khan',
    initials: 'ZK',
    avatarColor: 'bg-[#E8F5E9] text-[#0F5132]',
    ledgerCount: 0,
    netAmount: 0,
    tags: [],
    isOnLainDain: true,
    type: 'person',
  },
  // Invites
  {
    id: 'i1',
    name: 'Ayesha',
    phone: '+92 300 1234567',
    initials: 'A',
    avatarColor: 'bg-[#EFE7DD] text-[#9A9590]',
    ledgerCount: 0,
    netAmount: 0,
    tags: [],
    isOnLainDain: false,
    type: 'person',
  },
  {
    id: 'i2',
    name: 'Hassan Ali',
    phone: '+92 333 9876543',
    initials: 'HA',
    avatarColor: 'bg-[#EFE7DD] text-[#9A9590]',
    ledgerCount: 0,
    netAmount: 0,
    tags: [],
    isOnLainDain: false,
    type: 'person',
  },
  {
    id: 'i3',
    name: 'Kashif Jamil',
    phone: '+92 321 4455667',
    initials: 'KJ',
    avatarColor: 'bg-[#EFE7DD] text-[#9A9590]',
    ledgerCount: 0,
    netAmount: 0,
    tags: [],
    isOnLainDain: false,
    type: 'person',
  },
  {
    id: 'i4',
    name: 'Nida Fatima',
    phone: '+92 345 5566778',
    initials: 'NF',
    avatarColor: 'bg-[#EFE7DD] text-[#9A9590]',
    ledgerCount: 0,
    netAmount: 0,
    tags: [],
    isOnLainDain: false,
    type: 'person',
  },
  {
    id: 'i5',
    name: 'Waqas Ahmed',
    phone: '+92 312 8899001',
    initials: 'WA',
    avatarColor: 'bg-[#EFE7DD] text-[#9A9590]',
    ledgerCount: 0,
    netAmount: 0,
    tags: [],
    isOnLainDain: false,
    type: 'person',
  },
  {
    id: 'i6',
    name: 'Sadia Malik',
    phone: '+92 300 9900112',
    initials: 'SM',
    avatarColor: 'bg-[#EFE7DD] text-[#9A9590]',
    ledgerCount: 0,
    netAmount: 0,
    tags: [],
    isOnLainDain: false,
    type: 'person',
  },
]

export const useContactStore = create<ContactState>((set) => ({
  contacts: INITIAL_CONTACTS,
  hiddenLedgerIds: [],
  resetDay: 23,
  budgetLimit: 50000,
  alertNearingLimit: true,
  alertThreshold: 80,
  categoryBudgets: {
    grocery: 10000,
    transport: 8000,
    shopping: 12000,
    bills: 5000,
  },
  addContact: (contact) =>
    set((state) => ({
      contacts: [...state.contacts, contact],
    })),
  updateContact: (id, updatedFields) =>
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === id ? { ...c, ...updatedFields } : c
      ),
    })),
  deleteContact: (id) =>
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
    })),
  setHiddenLedgerIds: (ids) =>
    set(() => ({
      hiddenLedgerIds: ids,
    })),
  setResetDay: (day) =>
    set(() => ({
      resetDay: day,
    })),
  setBudgetLimit: (limit) =>
    set(() => ({
      budgetLimit: limit,
    })),
  setAlertNearingLimit: (val) =>
    set(() => ({
      alertNearingLimit: val,
    })),
  setAlertThreshold: (val) =>
    set(() => ({
      alertThreshold: val,
    })),
  setCategoryBudget: (catId, limit) =>
    set((state) => ({
      categoryBudgets: {
        ...state.categoryBudgets,
        [catId]: limit,
      },
    })),
}))

// Computed Selectors
export function selectReceivables(state: ContactState) {
  return state.contacts
    .filter((c) => !state.hiddenLedgerIds.includes(c.id))
    .filter((c) => c.netAmount > 0)
}

export function selectPayables(state: ContactState) {
  return state.contacts
    .filter((c) => !state.hiddenLedgerIds.includes(c.id))
    .filter((c) => c.netAmount < 0)
}

export function selectBalanceSummary(state: ContactState): BalanceSummary {
  const visibleContacts = state.contacts.filter(
    (c) => !state.hiddenLedgerIds.includes(c.id)
  )
  const totalReceivable = visibleContacts
    .filter((c) => c.netAmount > 0)
    .reduce((sum, c) => sum + c.netAmount, 0)
  const totalPayable = Math.abs(
    visibleContacts
      .filter((c) => c.netAmount < 0)
      .reduce((sum, c) => sum + c.netAmount, 0)
  )
  const netBalance = totalReceivable - totalPayable
  return {
    totalReceivable,
    totalPayable,
    netBalance,
    currency: 'PKR',
  }
}