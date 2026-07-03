import { useMemo } from 'react'
import { Handshake, HelpCircle, Building2 } from 'lucide-react'
import { useContactStore } from '@/store/use-contact-store'
import { useTransactionStore } from '@/store/use-transaction-store'
import { type TransactionListItem } from '@/components/shared/expense-list'
import { CATEGORIES } from '@/features/personal/components/category-picker'

export const getCategoryDetails = (catId: string) => {
  if (catId === 'payment') {
    return {
      label: 'Payment',
      color: '#0B683A',
      icon: Handshake,
    }
  }
  const option = CATEGORIES.find((c) => c.id === catId)
  if (option) return option
  return {
    label: 'Other',
    color: '#7F8C8D',
    icon: HelpCircle,
  }
}

/**
 * Resolves a group's contact record plus its derived ledger data (expenses
 * with display overrides, category totals, per-member balances). Extracted
 * from GroupDetailScreen so that data derivation and presentation are testable
 * independently.
 */
export function useGroupLedger(id: string) {
  const contacts = useContactStore((state) => state.contacts)
  const contact = contacts.find((c) => c.id === id)

  const transactionState = useTransactionStore((state) => state.transactionsByContact)

  // Get grouped transaction history
  const transactions = useMemo(() => {
    if (!contact) return { Today: [], Yesterday: [], Earlier: [] }
    const list = useTransactionStore.getState().getContactTransactions(id, contact.name)
    const firstName = contact.name.split(' ')[0]

    const items: TransactionListItem[] = list.map((record) => {
      const displaySubtitle = record.category === 'payment' ? (
        <div className="flex flex-col text-left">
          <span className="text-[#6B6B6B] text-[12px] font-normal">You paid {firstName}</span>
          <span className="text-[12px] text-[#9A9590] mt-0.5 font-normal">Balance adjusted</span>
        </div>
      ) : record.subtitle

      return {
        id: record.id,
        name: record.name,
        subtitle: displaySubtitle,
        amount: Math.abs(record.amount),
        category: record.category as any,
        rightSubtitle: record.rightSubtitle,
        showChevron: record.showChevron,
        className: record.className,
        amountColor: record.amount > 0 ? 'green' : record.amount < 0 ? 'orange' : 'black',
      }
    })

    const today: TransactionListItem[] = []
    const yesterday: TransactionListItem[] = []
    const earlier: TransactionListItem[] = []

    items.forEach((item) => {
      const sub = item.rightSubtitle.toLowerCase()
      if (sub.includes('today') || sub.includes('pm') || sub.includes('am')) {
        today.push(item)
      } else if (sub.includes('yesterday')) {
        yesterday.push(item)
      } else {
        earlier.push(item)
      }
    })

    return {
      Today: today,
      Yesterday: yesterday,
      Earlier: earlier,
    }
  }, [id, contact?.name, transactionState])

  // Flat combined list of expenses with custom category icon, background highlights, and chevron overrides matching the mockup
  const groupExpensesData = useMemo(() => {
    const flat = [...transactions.Today, ...transactions.Yesterday, ...transactions.Earlier]
    return flat.map((expense) => {
      // If Hotel Booking, add building icon
      if (expense.name.toLowerCase().includes('hotel')) {
        return {
          ...expense,
          amountColor: 'black' as const,
          leftSlot: (
            <div className="w-12 h-12 rounded-[13px] bg-[#E3F2FD] flex items-center justify-center shrink-0">
              <Building2 size={24} className="text-[#1F618D]" />
            </div>
          )
        }
      }

      // If payment category, color green and hide chevron
      if (expense.category === 'payment') {
        return {
          ...expense,
          amountColor: 'green' as const,
          showChevron: false,
          className: 'bg-[#ECF6F0] hover:bg-[#ECF6F0]/90 text-[#0B683A]'
        }
      }

      // Default: color black
      return {
        ...expense,
        amountColor: 'black' as const
      }
    })
  }, [transactions])

  // Group groupExpensesData by category
  const categoriesSummary = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {}
    groupExpensesData.forEach((exp) => {
      const cat = exp.category || 'other'
      if (!map[cat]) {
        map[cat] = { count: 0, total: 0 }
      }
      map[cat].count += 1
      map[cat].total += Math.abs(exp.amount)
    })
    return Object.entries(map).map(([catId, summary]) => {
      const details = getCategoryDetails(catId)
      return {
        id: catId,
        label: details.label,
        count: summary.count,
        total: summary.total,
        color: details.color,
        icon: details.icon,
      }
    })
  }, [groupExpensesData])

  const groupBalances = useMemo(() => {
    if (id === '5') {
      return [
        {
          id: 'gb1',
          name: 'Ali Hassan',
          initials: 'AH',
          avatarColor: 'bg-[#E8F5E9] text-[#0B683A]',
          subtitle: 'Has to pay you',
          direction: 'in' as const,
          amount: 3500,
        },
        {
          id: 'gb2',
          name: 'Sara Khan',
          initials: 'SK',
          avatarColor: 'bg-[#FFF8E1] text-[#C96A1B]',
          subtitle: 'Has to pay you',
          direction: 'in' as const,
          amount: 1500,
        },
        {
          id: 'gb3',
          name: 'Usman',
          initials: 'US',
          avatarColor: 'bg-[#E3F2FD] text-[#1E3A8A]',
          subtitle: 'You have to pay',
          direction: 'out' as const,
          amount: 380,
        }
      ]
    }
    // Fallback member balances (Family group or other)
    return [
      {
        id: 'fgb1',
        name: 'Sara Khan',
        initials: 'SK',
        avatarColor: 'bg-[#FFF8E1] text-[#C96A1B]',
        subtitle: 'Has to pay you',
        direction: 'in' as const,
        amount: 1450,
      },
      {
        id: 'fgb2',
        name: 'Hamza Ali',
        initials: 'HA',
        avatarColor: 'bg-[#E3F2FD] text-[#1E3A8A]',
        subtitle: 'You have to pay',
        direction: 'out' as const,
        amount: 250,
      }
    ]
  }, [id])

  return { contact, groupExpensesData, categoriesSummary, groupBalances }
}
