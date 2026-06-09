import type { BalanceSummary, ContactLedger } from '../types'

export const MOCK_BALANCE: BalanceSummary = {
  totalReceivable: 13800,
  totalPayable: 2230,
  netBalance: 11570,
  currency: 'PKR',
}

export const MOCK_RECEIVABLES: ContactLedger[] = [
  {
    id: '1',
    name: 'Ali Hassan',
    initials: 'AH',
    avatarColor: 'bg-[#E8F5E9]',
    ledgerCount: 3,
    netAmount: 7500,
    isOnline: true,
    type: 'person',
    tags: [
      { name: '1-to-1 Ledger', amount: 6000 },
      { name: 'Murree Trip Group', amount: 2000 },
      { name: 'Poker Group', amount: -500 },
    ],
  },
  {
    id: '2',
    name: 'Sara Khan',
    initials: 'SK',
    avatarColor: 'bg-[#FFF8E1]',
    ledgerCount: 2,
    netAmount: 2650,
    isOnline: true,
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
]

export const MOCK_PAYABLES: ContactLedger[] = [
  {
    id: '4',
    name: 'Hamza Ali',
    initials: 'HA',
    avatarColor: 'bg-[#E3F2FD]',
    ledgerCount: 2,
    netAmount: -1800,
    isOnline: true,
    type: 'person',
    tags: [
      { name: 'Murree', amount: -2000 },
      { name: 'Groceries', amount: 200 },
    ],
  },
  {
    id: '5',
    name: 'Murree Trip',
    initials: '🏕️',
    avatarColor: 'bg-[#E8F5E9]',
    ledgerCount: 1,
    netAmount: -430,
    isOnline: false,
    type: 'group',
    tags: [
      { name: 'Fuel', amount: -430 },
    ],
  },
]
