import { useState } from 'react'

/**
 * Digits-only amount input with comma-formatted display - shared by every
 * expense-style form (AddExpenseBase, recurring payments) to avoid each one
 * reimplementing the same parsing/formatting logic.
 *
 * maxDigits defaults to 10, not the backend's max_digits=12 — every caller
 * submits the amount via .toFixed(2), and DecimalField's max_digits counts
 * ALL significant digits including those two decimal places, so a 12-digit
 * integer + ".00" is 14 digits total and gets rejected ("Ensure that there
 * are no more than 12 digits in total."). isTooLong is computed reactively
 * (not just capped on keystroke) to also catch a pre-filled edit-mode value
 * that already exceeds it.
 */
export function useFormattedAmountInput(initialValue = '', maxDigits = 10) {
  const [amount, setAmount] = useState(initialValue)

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '')
    setAmount(rawVal)
  }

  const formattedAmount = amount ? Number(amount).toLocaleString('en-US') : ''
  const isTooLong = amount.length > maxDigits

  return { amount, setAmount, handleAmountChange, formattedAmount, isTooLong }
}
