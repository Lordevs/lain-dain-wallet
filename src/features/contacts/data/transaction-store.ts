import { type ExpenseCategory } from '@/components/shared/expense-item'

export interface TransactionRecord {
  id: string
  name: string
  subtitle: string
  amount: number
  category: ExpenseCategory
  rightSubtitle: string
  showChevron?: boolean
  className?: string
  splitType?: 'equal' | 'unequal' | 'adjustment'
  dateValue?: string
  note?: string
}

// Initial seed data
export const TRANSACTION_STORE: Record<string, TransactionRecord[]> = {
  '1': [
    {
      id: 't1',
      name: 'Dinner at Monal',
      subtitle: 'You paid',
      amount: 2000,
      category: 'food',
      rightSubtitle: '8:15 PM',
      splitType: 'equal',
      dateValue: 'Today'
    },
    {
      id: 'y1',
      name: 'Fuel',
      subtitle: 'You paid',
      amount: 1500,
      category: 'fuel',
      rightSubtitle: '6:30 PM',
      splitType: 'equal',
      dateValue: 'Today'
    },
    {
      id: 'e1',
      name: 'Payment received',
      subtitle: 'You paid Ali',
      amount: 1000,
      category: 'payment',
      rightSubtitle: '5:40 PM',
      showChevron: true,
      className: 'bg-[#DFF2E8] hover:bg-[#F0FDF4]/90',
      splitType: 'equal',
      dateValue: 'Today'
    },
    {
      id: 'e2',
      name: 'Grocery',
      subtitle: 'Ali paid',
      amount: -3500,
      category: 'shopping',
      rightSubtitle: 'Sun, 4:45 PM',
      splitType: 'equal',
      dateValue: 'Today'
    },
    {
      id: 'e3',
      name: 'Tea & snacks',
      subtitle: 'You paid',
      amount: 500,
      category: 'food',
      rightSubtitle: 'Sun, 2:10 PM',
      splitType: 'equal',
      dateValue: 'Today'
    }
  ],
  '5': [
    {
      id: 'mt1',
      name: 'Hotel Booking',
      subtitle: 'Ali paid',
      amount: 3000,
      category: 'other',
      rightSubtitle: '10:30 AM',
      splitType: 'equal',
      dateValue: 'Today'
    },
    {
      id: 'mt2',
      name: 'Fuel',
      subtitle: 'You paid',
      amount: 1250,
      category: 'fuel',
      rightSubtitle: '5:22 PM',
      splitType: 'equal',
      dateValue: 'Today'
    },
    {
      id: 'mt3',
      name: 'Payment settled',
      subtitle: 'You paid Ali\nBalance adjusted',
      amount: 1000,
      category: 'payment',
      rightSubtitle: '5:40 PM',
      showChevron: true,
      className: 'bg-[#ECF6F0] hover:bg-[#ECF6F0]/90 text-[#0B683A]',
      splitType: 'equal',
      dateValue: 'Today'
    },
    {
      id: 'mt4',
      name: 'Dinner',
      subtitle: 'Sara paid',
      amount: 850,
      category: 'food',
      rightSubtitle: '8:45 PM',
      splitType: 'equal',
      dateValue: 'Today'
    },
    {
      id: 'mt5',
      name: 'Snacks',
      subtitle: 'Hassan paid',
      amount: 300,
      category: 'food',
      rightSubtitle: '11:08 PM',
      splitType: 'equal',
      dateValue: 'Today'
    },
    {
      id: 'mt6',
      name: 'Motorway Toll',
      subtitle: 'You paid',
      amount: 200,
      category: 'transport',
      rightSubtitle: '2 days ago',
      splitType: 'equal',
      dateValue: 'Today'
    },
    {
      id: 'mt7',
      name: 'Breakfast',
      subtitle: 'Ali paid',
      amount: 550,
      category: 'food',
      rightSubtitle: '2 days ago',
      splitType: 'equal',
      dateValue: 'Today'
    }
  ]
}

export function getContactTransactions(contactId: string, contactName: string): TransactionRecord[] {
  // If we already have items in the store for this contact, return them
  if (TRANSACTION_STORE[contactId]) {
    return TRANSACTION_STORE[contactId]
  }

  // Fallback initial data generator
  const firstName = contactName.split(' ')[0]
  const isNetPositive = contactName.toLowerCase().includes('family') || contactId === '2' // fallback rule

  const fallbackData: TransactionRecord[] = contactName.toLowerCase().includes('family') ? [
    {
      id: 'fe1',
      name: 'Eid Shopping',
      subtitle: 'You paid',
      amount: 1200,
      category: 'shopping',
      rightSubtitle: '2 weeks ago',
      splitType: 'equal',
      dateValue: 'Today'
    },
    {
      id: 'fe2',
      name: 'Weekly Groceries',
      subtitle: `${firstName} paid`,
      amount: -1250,
      category: 'shopping',
      rightSubtitle: '3 weeks ago',
      splitType: 'equal',
      dateValue: 'Today'
    }
  ] : [
    {
      id: 'fallback-1',
      name: 'Personal Expenses',
      subtitle: 'You paid',
      amount: isNetPositive ? 3000 : -3000,
      category: 'other',
      rightSubtitle: '3 days ago',
      splitType: 'equal',
      dateValue: 'Today'
    },
    {
      id: 'fallback-2',
      name: 'Grocery Split',
      subtitle: `${firstName} paid`,
      amount: isNetPositive ? -1500 : 1500,
      category: 'shopping',
      rightSubtitle: '5 days ago',
      splitType: 'equal',
      dateValue: 'Today'
    }
  ]

  TRANSACTION_STORE[contactId] = fallbackData
  return fallbackData
}
