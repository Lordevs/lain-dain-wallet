export interface RecurringPaymentRecord {
  id: string
  name: string
  amount: number
  paidById: string // 'ali', 'hassan', 'sara', 'you', etc.
  paidByName: string
  nextBillingDate: string // e.g. 'June 15, 2026'
  nextBillingStatus: 'orange' | 'green'
  category: string // e.g. 'entertainment', 'bills', etc.
  frequency: 'Monthly' | 'Weekly'
  startsOn: string // e.g. '15 June 2026'
  splitType?: 'equal' | 'unequal' | 'adjustment'
}

// Global recurring payments store seeded with mock data
export const RECURRING_STORE: Record<string, RecurringPaymentRecord[]> = {
  // '5' represents the group under edit/settings (e.g. Murree Trip)
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
  ]
}

export function getGroupRecurringPayments(groupId: string): RecurringPaymentRecord[] {
  if (!RECURRING_STORE[groupId]) {
    // Generate empty array if none exists
    RECURRING_STORE[groupId] = []
  }
  return RECURRING_STORE[groupId]
}
