import { create } from 'zustand'
import {
  Bus,
  ShoppingBag,
  ShoppingCart,
  Receipt,
  Activity,
  Film,
  Fuel as FuelIcon,
  HelpCircle,
  ForkKnife,
  type LucideIcon,
} from 'lucide-react'

export interface CategoryOption {
  id: string
  label: string
  color: string // hex color of icon
  icon: LucideIcon
  expensesCount: number
  totalAmount: number
  isHidden?: boolean
  badges?: Array<{
    label: string
    type: 'cycle' | 'budget'
  }>
}

interface CategoryState {
  categories: CategoryOption[]
  addCategory: (name: string, icon: LucideIcon, color: string) => void
  hideCategory: (id: string, isHidden: boolean) => void
  deleteCategory: (id: string) => void
  reorderCategories: (newOrder: CategoryOption[]) => void
}

const INITIAL_CATEGORIES: CategoryOption[] = [
  { id: 'grocery', label: 'Grocery', color: '#27AE60', icon: ShoppingCart, expensesCount: 15, totalAmount: 18200, badges: [
    { label: 'Monthly cycle · 1st', type: 'cycle' },
    { label: 'Budget: Rs. 12,000', type: 'budget' }
  ]},
  { id: 'transport', label: 'Transport', color: '#C96A1B', icon: Bus, expensesCount: 12, totalAmount: 8400 },
  { id: 'food', label: 'Food', color: '#D35400', icon: ForkKnife, expensesCount: 8, totalAmount: 5300 },
  { id: 'shopping', label: 'Shopping', color: '#7D3C98', icon: ShoppingBag, expensesCount: 7, totalAmount: 12600 },
  { id: 'bills', label: 'Bills', color: '#16A085', icon: Receipt, expensesCount: 4, totalAmount: 6500 },
  { id: 'health', label: 'Health', color: '#C0392B', icon: Activity, expensesCount: 2, totalAmount: 1800 },
  { id: 'entertainment', label: 'Entertainment', color: '#D35400', icon: Film, expensesCount: 3, totalAmount: 2550 },
  { id: 'fuel', label: 'Fuel', color: '#F39C12', icon: FuelIcon, expensesCount: 9, totalAmount: 7200 },
  { id: 'other', label: 'Other', color: '#7F8C8D', icon: HelpCircle, expensesCount: 2, totalAmount: 950 },
]

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: INITIAL_CATEGORIES,
  addCategory: (name, icon, color) => {
    const newId = name.toLowerCase().replace(/\s+/g, '-')
    const newCat: CategoryOption = {
      id: newId,
      label: name,
      color: color,
      icon: icon,
      expensesCount: 0,
      totalAmount: 0,
    }
    set((state) => {
      if (state.categories.some((c) => c.id === newId)) return state
      return { categories: [...state.categories, newCat] }
    })
  },
  hideCategory: (id, isHidden) => {
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, isHidden } : c
      ),
    }))
  },
  deleteCategory: (id) => {
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }))
  },
  reorderCategories: (newOrder) => {
    set({ categories: newOrder })
  },
}))
