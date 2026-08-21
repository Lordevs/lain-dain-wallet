import { create } from 'zustand'
import type { TransactionRecord } from '@/types'

// Re-exported for existing consumers that import the type from this store;
// the canonical definition lives in `@/types`.
export type { TransactionRecord }

interface TransactionState {
  transactionsByContact: Record<string, TransactionRecord[]>
  getContactTransactions: (contactId: string) => TransactionRecord[]
  addTransaction: (contactId: string, tx: TransactionRecord) => void
  updateTransaction: (contactId: string, tx: TransactionRecord) => void
  deleteTransaction: (contactId: string, txId: string) => void
  clearTransactions: (contactId: string) => void
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactionsByContact: {},

  getContactTransactions: (contactId) => get().transactionsByContact[contactId] ?? [],

  addTransaction: (contactId, tx) =>
    set((state) => ({
      transactionsByContact: {
        ...state.transactionsByContact,
        [contactId]: [tx, ...(state.transactionsByContact[contactId] || [])],
      },
    })),

  updateTransaction: (contactId, tx) =>
    set((state) => ({
      transactionsByContact: {
        ...state.transactionsByContact,
        [contactId]: (state.transactionsByContact[contactId] || []).map((item) =>
          item.id === tx.id ? tx : item
        ),
      },
    })),

  deleteTransaction: (contactId, txId) =>
    set((state) => ({
      transactionsByContact: {
        ...state.transactionsByContact,
        [contactId]: (state.transactionsByContact[contactId] || []).filter(
          (item) => item.id !== txId
        ),
      },
    })),

  clearTransactions: (contactId) =>
    set((state) => {
      const next = { ...state.transactionsByContact }
      delete next[contactId]
      return { transactionsByContact: next }
    })
}))
