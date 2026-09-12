import { useState } from 'react'

/**
 * Digits-only amount input with comma-formatted display - shared by every
 * expense-style form (AddExpenseBase, recurring payments) to avoid each one
 * reimplementing the same parsing/formatting logic.
 *
 * Amounts are capped while typing so mobile users cannot enter more than the
 * supported number of digits. isTooLong still catches an oversized value
 * loaded into an edit form from older data.
 */
export function useFormattedAmountInput(initialValue = '', maxDigits = 7) {
  const [amount, setAmount] = useState(initialValue)

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, maxDigits)
    setAmount(rawVal)
  }

  const formattedAmount = amount ? Number(amount).toLocaleString('en-US') : ''
  const isTooLong = amount.length > maxDigits

  return { amount, setAmount, handleAmountChange, formattedAmount, isTooLong }
}
