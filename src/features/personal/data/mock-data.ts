import type { PersonalExpense, MonthlyExpenseSummary } from '../types'

export interface FilteredExpenseData {
  label: string
  summary: MonthlyExpenseSummary
  expenses: PersonalExpense[]
}

export const FILTER_DATA: Record<'this_month' | 'last_month' | 'all_time', FilteredExpenseData> = {
  this_month: {
    label: 'January',
    summary: {
      totalSpent: 48250, // Let's keep the user's wowed numbers
      currency: 'PKR',
      differenceAmount: 5250,
      differenceMonth: 'December',
    },
    expenses: [
      {
        id: '1',
        name: 'Dinner at Monal',
        subtitle: 'You paid',
        amount: 2000,
        currency: 'PKR',
        category: 'food',
      },
      {
        id: '2',
        name: 'Fuel',
        subtitle: 'Ali paid',
        amount: 1500,
        currency: 'PKR',
        category: 'fuel',
      },
      {
        id: '3',
        name: 'Grocery',
        subtitle: 'Ali paid',
        amount: 3000,
        currency: 'PKR',
        category: 'shopping',
      },
      {
        id: '4',
        name: 'Tea & snacks',
        subtitle: 'You paid',
        amount: 500,
        currency: 'PKR',
        category: 'food',
      },
    ],
  },
  last_month: {
    label: 'December',
    summary: {
      totalSpent: 32400,
      currency: 'PKR',
      differenceAmount: 3400,
      differenceMonth: 'November',
    },
    expenses: [
      {
        id: 'dec-1',
        name: 'Electricity Bill',
        subtitle: 'You paid',
        amount: 8500,
        currency: 'PKR',
        category: 'other',
      },
      {
        id: 'dec-2',
        name: 'Weekly Groceries',
        subtitle: 'You paid',
        amount: 4000,
        currency: 'PKR',
        category: 'shopping',
      },
      {
        id: 'dec-3',
        name: 'Car Maintenance',
        subtitle: 'You paid',
        amount: 12000,
        currency: 'PKR',
        category: 'other',
      },
    ],
  },
  all_time: {
    label: 'All Time',
    summary: {
      totalSpent: 80650,
      currency: 'PKR',
      differenceAmount: 8650,
      differenceMonth: 'Previous Period',
    },
    expenses: [
      {
        id: '1',
        name: 'Dinner at Monal',
        subtitle: 'You paid',
        amount: 2000,
        currency: 'PKR',
        category: 'food',
      },
      {
        id: '2',
        name: 'Fuel',
        subtitle: 'Ali paid',
        amount: 1500,
        currency: 'PKR',
        category: 'fuel',
      },
      {
        id: '3',
        name: 'Grocery',
        subtitle: 'Ali paid',
        amount: 3000,
        currency: 'PKR',
        category: 'shopping',
      },
      {
        id: '4',
        name: 'Tea & snacks',
        subtitle: 'You paid',
        amount: 500,
        currency: 'PKR',
        category: 'food',
      },
      {
        id: 'dec-1',
        name: 'Electricity Bill',
        subtitle: 'You paid',
        amount: 8500,
        currency: 'PKR',
        category: 'other',
      },
      {
        id: 'dec-2',
        name: 'Weekly Groceries',
        subtitle: 'You paid',
        amount: 4000,
        currency: 'PKR',
        category: 'shopping',
      },
      {
        id: 'dec-3',
        name: 'Car Maintenance',
        subtitle: 'You paid',
        amount: 12000,
        currency: 'PKR',
        category: 'other',
      },
    ],
  },
}

export const MOCK_EXPENSE_SUMMARY = FILTER_DATA.this_month.summary
export const MOCK_EXPENSES = FILTER_DATA.this_month.expenses

export const REPORTS_MOCK_DATA: Record<'april_2026' | 'march_2026' | 'february_2026', any> = {
  april_2026: {
    summary: {
      totalSpent: 48250,
      currency: 'PKR',
      differenceAmount: 5250,
      differenceMonth: 'March',
    },
    categories: [
      { id: '1', label: 'Food', amount: 26000, percentage: 54, color: '#01592B' },
      { id: '2', label: 'Bills & Utilities', amount: 9500, percentage: 20, color: '#74A88E' },
      { id: '3', label: 'Fuel', amount: 7000, percentage: 14, color: '#A9CCB8' },
      { id: '4', label: 'Pharmacy', amount: 5750, percentage: 12, color: '#FDB105' },
    ],
    monthlySpending: [
      { month: 'Jan', amount: 12000 },
      { month: 'Feb', amount: 16000 },
      { month: 'Mar', amount: 18000 },
      { month: 'Apr', amount: 24000 },
      { month: 'May', amount: 20000 },
      { month: 'Jun', amount: 26000 },
      { month: 'Jul', amount: 30000 },
      { month: 'Aug', amount: 34000 },
      { month: 'Sep', amount: 38000 },
      { month: 'Oct', amount: 42000 },
      { month: 'Nov', amount: 50000 },
      { month: 'Dec', amount: 44000 },
    ],
  },
  march_2026: {
    summary: {
      totalSpent: 43000,
      currency: 'PKR',
      differenceAmount: 4200,
      differenceMonth: 'February',
    },
    categories: [
      { id: '1', label: 'Food', amount: 21500, percentage: 50, color: '#01592B' },
      { id: '2', label: 'Bills & Utilities', amount: 10750, percentage: 25, color: '#74A88E' },
      { id: '3', label: 'Fuel', amount: 6450, percentage: 15, color: '#A9CCB8' },
      { id: '4', label: 'Pharmacy', amount: 4300, percentage: 10, color: '#FDB105' },
    ],
    monthlySpending: [
      { month: 'Jan', amount: 12000 },
      { month: 'Feb', amount: 16000 },
      { month: 'Mar', amount: 18000 },
      { month: 'Apr', amount: 24000 },
      { month: 'May', amount: 20000 },
      { month: 'Jun', amount: 26000 },
      { month: 'Jul', amount: 30000 },
      { month: 'Aug', amount: 34000 },
      { month: 'Sep', amount: 38000 },
      { month: 'Oct', amount: 42000 },
      { month: 'Nov', amount: 50000 },
      { month: 'Dec', amount: 44000 },
    ],
  },
  february_2026: {
    summary: {
      totalSpent: 38800,
      currency: 'PKR',
      differenceAmount: 2800,
      differenceMonth: 'January',
    },
    categories: [
      { id: '1', label: 'Food', amount: 18624, percentage: 48, color: '#01592B' },
      { id: '2', label: 'Bills & Utilities', amount: 8536, percentage: 22, color: '#74A88E' },
      { id: '3', label: 'Fuel', amount: 6208, percentage: 16, color: '#A9CCB8' },
      { id: '4', label: 'Pharmacy', amount: 5432, percentage: 14, color: '#FDB105' },
    ],
    monthlySpending: [
      { month: 'Jan', amount: 12000 },
      { month: 'Feb', amount: 16000 },
      { month: 'Mar', amount: 18000 },
      { month: 'Apr', amount: 24000 },
      { month: 'May', amount: 20000 },
      { month: 'Jun', amount: 26000 },
      { month: 'Jul', amount: 30000 },
      { month: 'Aug', amount: 34000 },
      { month: 'Sep', amount: 38000 },
      { month: 'Oct', amount: 42000 },
      { month: 'Nov', amount: 50000 },
      { month: 'Dec', amount: 44000 },
    ],
  },
}
