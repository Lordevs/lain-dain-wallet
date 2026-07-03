import { useState } from 'react'

/**
 * Digits-only amount input with comma-formatted display - shared by every
 * expense-style form (AddExpenseBase, recurring payments) to avoid each one
 * reimplementing the same parsing/formatting logic.
 */
export function useFormattedAmountInput(initialValue = '') {
  const [amount, setAmount] = useState(initialValue)

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '')
    setAmount(rawVal)
  }

  const formattedAmount = amount ? Number(amount).toLocaleString('en-US') : ''

  return { amount, setAmount, handleAmountChange, formattedAmount }
}
