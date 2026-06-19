import { create } from 'zustand'

export interface RecurringPaymentRecord {
  id: string
  name: string
  amount: number
  paidById: string
  paidByName: string
  nextBillingDate: string
  nextBillingStatus: 'orange' | 'green'
  category: string
  frequency: 'Monthly' | 'Weekly'
  startsOn: string
  splitType?: 'equal' | 'unequal' | 'adjustment'
}

interface RecurringState {
  /** Payments keyed by group id */
  paymentsByGroup: Record<string, RecurringPaymentRecord[]>

  getPayments: (groupId: string) => RecurringPaymentRecord[]
  addPayment: (groupId: string, record: RecurringPaymentRecord) => void
  updatePayment: (groupId: string, record: RecurringPaymentRecord) => void
  deletePayment: (groupId: string, paymentId: string) => void
}

const INITIAL_DATA: Record<string, RecurringPaymentRecord[]> = {
  '5': [
    {
      id: 'r1',
      name: 'Netflix Split',
      amount: 1500,
      paidById: 'ali',
      paidByName: 'Ali Hassan',
      nextBillingDate: 'June 15, 2026',
      nextBillingStatus: 'orange',
      category: 'entertainment',
      frequency: 'Monthly',
      startsOn: '15 June 2026',
      splitType: 'equal',
    },
    {
      id: 'r2',
      name: 'House Rent Split',
      amount: 1000,
      paidById: 'hassan',
      paidByName: 'Hassan',
      nextBillingDate: 'July 1, 2026',
      nextBillingStatus: 'orange',
      category: 'bills',
      frequency: 'Monthly',
      startsOn: '1 July 2026',
      splitType: 'equal',
    },
    {
      id: 'r3',
      name: 'Spotify Family',
      amount: 2500,
      paidById: 'sara',
      paidByName: 'Sara Khan',
      nextBillingDate: 'June 20, 2026',
      nextBillingStatus: 'green',
      category: 'entertainment',
      frequency: 'Monthly',
      startsOn: '20 June 2026',
      splitType: 'equal',
    },
  ],
}

export const useRecurringStore = create<RecurringState>((set, get) => ({
  paymentsByGroup: INITIAL_DATA,

  getPayments: (groupId) => get().paymentsByGroup[groupId] ?? [],

  addPayment: (groupId, record) =>
    set((state) => ({
      paymentsByGroup: {
        ...state.paymentsByGroup,
        [groupId]: [...(state.paymentsByGroup[groupId] ?? []), record],
      },
    })),

  updatePayment: (groupId, record) =>
    set((state) => ({
      paymentsByGroup: {
        ...state.paymentsByGroup,
        [groupId]: (state.paymentsByGroup[groupId] ?? []).map((p) =>
          p.id === record.id ? record : p
        ),
      },
    })),

  deletePayment: (groupId, paymentId) =>
    set((state) => ({
      paymentsByGroup: {
        ...state.paymentsByGroup,
        [groupId]: (state.paymentsByGroup[groupId] ?? []).filter(
          (p) => p.id !== paymentId
        ),
      },
    })),
}))
