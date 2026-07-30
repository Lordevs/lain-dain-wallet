import type { components } from '@/lib/api/schema'
import type { ExpenseListData } from '@/components/shared/expense-list'

type MyExpenseItem = components['schemas']['MyExpenseItem']

function paidByLabel(item: MyExpenseItem, myId: string | undefined): string {
  if (item.context === 'personal') return 'You paid'
  if (item.payers.length > 1) return 'Split payment'
  const payer = item.payers[0]
  if (!payer) return ''
  return payer.id === myId ? 'You paid' : `${payer.full_name} paid`
}

/** Maps one row of the combined "My Expenses" feed into the shared
 * ExpenseList's generic item shape — `your_share` (not the full expense
 * amount) is what "you spent" means for a shared expense. */
export function toExpenseListItem(item: MyExpenseItem, myId: string | undefined): ExpenseListData {
  return {
    id: item.id,
    name: item.description,
    subtitle: paidByLabel(item, myId),
    amount: Number(item.your_share),
    currency: item.currency,
    categoryIcon: item.category.icon,
    categoryColor: item.category.color,
    rightSubtitle: new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
    }),
    amountColor: 'black',
  }
}
