// Intentionally empty — split-brain architecture note:
//
// During UI-only development the app has TWO parallel data sources:
//   1. Module-level mock arrays  (src/features/dashboard/data/mock-data.ts)
//      – MOCK_RECEIVABLES / MOCK_PAYABLES, mutated in-place by add/edit screens
//   2. Module-level transaction log  (src/features/contacts/data/transaction-store.ts)
//      – TRANSACTION_STORE[contactId] = TxRecord[], mutated by the same screens
//
// Both are plain JS objects; React re-renders happen because the screens
// force a re-mount (drawer open/close) rather than via reactive state.
//
// When a real backend is wired up, this Zustand store will replace both
// sources and should expose: fetchTransactions(), addTransaction(),
// editTransaction(), deleteTransaction() — all making API calls and
// updating a single reactive slice of state.