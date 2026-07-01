import { type SplitData } from '@/components/shared/split-expense-drawer'

/**
 * Calculates how much the contact owes (positive) or is owed (negative) given
 * the total expense amount, who paid, and the chosen split configuration.
 *
 * Positive result  → contact owes you money (you paid)
 * Negative result  → you owe the contact money (contact paid)
 */
export function calculateContactOwesAmount(
  parsedAmount: number,
  paidBy: 'you' | 'contact',
  splitData: SplitData,
): number {
  if (splitData.type === 'equal') {
    const selectedCount = splitData.selectedMembers.length
    if (selectedCount === 0) return 0
    const share = parsedAmount / selectedCount
    if (paidBy === 'you') {
      return splitData.selectedMembers.includes('contact') ? share : 0
    }
    return splitData.selectedMembers.includes('you') ? -share : 0
  }

  if (splitData.type === 'unequal') {
    if (paidBy === 'you') {
      return Number(splitData.unequalAmounts.contact) || 0
    }
    return -(Number(splitData.unequalAmounts.you) || 0)
  }

  if (splitData.type === 'adjustment') {
    const adjYou = Number(splitData.adjustmentAmounts.you) || 0
    const adjContact = Number(splitData.adjustmentAmounts.contact) || 0
    const totalAdjustments = adjYou + adjContact
    // Use Math.floor to avoid floating-point rounding that creates penny gaps
    const baseSplit = Math.max(0, parsedAmount - totalAdjustments)
    const basePerPerson = Math.floor(baseSplit / 2)
    const finalYou = basePerPerson + adjYou
    const finalContact = basePerPerson + adjContact
    if (paidBy === 'you') {
      return finalContact
    }
    return -finalYou
  }

  return 0
}
