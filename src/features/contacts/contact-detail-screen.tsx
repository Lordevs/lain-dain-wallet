import { useMemo } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import ContactAvatar from '@/components/shared/contact-avatar'
import { ROUTES } from '@/constants/routes'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import FlowHeader from '@/components/shared/flow-header'
import ExpenseList, { type TransactionListItem } from '@/components/shared/expense-list'
import { useContactLedgers } from '@/features/contacts/hooks/use-contact-ledgers'
import { useFriendshipTransactionsQuery } from '@/features/contacts/api/use-friendship-transactions-query'

function initialsForName(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2) || '?'
  )
}

/**
 * ContactDetailScreen — real 1:1 ledger view for one specific person,
 * keyed by their `User.id` (not a Contact address-book row, not a
 * Friendship id — see GET /api/expenses/with/{user_id}/'s docstring).
 * Ensures a Friendship exists (idempotent) so this also works as a direct
 * deep link, not just when reached through the New Lain Dain flow.
 */
export default function ContactDetailScreen() {
  const { id: userId } = useParams({ from: '/contacts/$id/' })
  const navigate = useNavigate({ from: '/contacts/$id/' })

  const ledgers = useContactLedgers(userId)
  const transactions = useFriendshipTransactionsQuery(ledgers.friendshipId)

  const items: TransactionListItem[] = useMemo(() => {
    if (!transactions.data) return []
    return transactions.data.map((t) => {
      if (t.kind === 'expense') {
        // A 1:1 friendship expense only ever has these two participants —
        // if the other person isn't among the payers, the current user paid.
        const otherUserId = ledgers.data?.other_user.id
        const youPaid = !t.data.payers.some((p) => p.id === otherUserId)
        const payerNames = t.data.payers.length > 1 ? 'Split payment' : t.data.payers[0]?.full_name
        return {
          id: t.data.id,
          name: t.data.description,
          subtitle: youPaid ? 'You paid' : `${payerNames} paid`,
          amount: Number(t.data.amount),
          currency: t.data.currency,
          rightSubtitle: new Date(t.data.date).toLocaleDateString(),
          showChevron: true,
          amountColor: 'default' as const,
        }
      }
      return {
        id: t.data.id,
        name: t.data.status === 'confirmed' ? 'Settlement' : 'Settlement (pending)',
        subtitle: `${t.data.payer.full_name} paid ${t.data.payee.full_name}`,
        amount: Number(t.data.amount),
        currency: t.data.currency,
        rightSubtitle: new Date(t.data.date).toLocaleDateString(),
        showChevron: true,
        amountColor: 'green' as const,
      }
    })
  }, [transactions.data, ledgers.data])

  if (ledgers.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#FEFAF1]">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  if (ledgers.isError || !ledgers.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#FEFAF1]">
        <p className="text-muted-foreground text-sm mb-4">Couldn't load this contact.</p>
        <button
          onClick={() => navigate({ to: ROUTES.DASHBOARD })}
          className="text-primary font-bold hover:underline border-0 bg-transparent cursor-pointer"
        >
          Go Back
        </button>
      </div>
    )
  }

  const { other_user: otherUser, overall } = ledgers.data
  const primaryBalance = overall[0]
  const amount = primaryBalance ? Number(primaryBalance.net_amount) : 0
  const isPositive = primaryBalance?.direction === 'owed_to_you'
  const isNegative = primaryBalance?.direction === 'you_owe'
  const currency = primaryBalance?.currency ?? 'PKR'
  const formattedVal = formatCurrency(amount, currency)

  const statusLabel = isPositive ? 'You will receive' : isNegative ? 'You owe' : 'Settle up'
  const amountColorClass = isPositive ? 'text-positive' : isNegative ? 'text-[#C96A1B]' : 'text-[#1A1A1A]'
  const initials = initialsForName(otherUser.full_name)

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-24 relative select-none">
      <FlowHeader
        title={otherUser.full_name}
        subtitle="Personal Balance"
        backVariant="minimal"
        avatar={
          <div className="relative shrink-0 flex items-center">
            <ContactAvatar
              initials={initials}
              avatarColor="bg-[#E3F2FD] text-[#1E3A8A]"
              src={otherUser.image ?? undefined}
              size="md"
              className="size-11 text-sm font-bold"
            />
          </div>
        }
        rightSlot={undefined}
      />

      {/* Overall Balance Stat Card */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex items-center justify-between">
          <div className="flex flex-col text-left">
            <span className="text-[#6B6B6B] text-[13px] font-semibold">{statusLabel}</span>
            <span className={cn('text-3xl font-extrabold mt-2 leading-none tracking-tight', amountColorClass)}>
              {formattedVal}
            </span>
          </div>
          {isPositive && (
            <button
              type="button"
              onClick={() => navigate({ to: ROUTES.CONTACT_REMINDER, params: { id: userId } })}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#0B683A4D] bg-[#E4F2EB] text-positive text-xs font-bold transition-all hover:bg-[#E4F2EB]/80 shrink-0 cursor-pointer outline-none"
            >
              <Bell size={13} className="text-positive" strokeWidth={2.5} />
              Remind
            </button>
          )}
        </div>
      </div>

      {/* Transaction history */}
      <div className="flex flex-col gap-5 px-6 pb-12 overflow-y-auto">
        {transactions.isLoading && (
          <p className="text-muted-foreground text-sm text-center py-8">Loading history...</p>
        )}
        {!transactions.isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center select-none bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)]">
            <p className="text-muted-foreground text-sm font-semibold">No transactions yet</p>
            <p className="text-xs text-[#9A9590] mt-1 font-medium">Add an expense to start the ledger history</p>
          </div>
        )}
        {items.length > 0 && (
          <ExpenseList
            expenses={items}
            onItemClick={(tid) => navigate({ to: ROUTES.TRANSACTION_DETAILS, params: { id: tid.toString() } })}
          />
        )}
      </div>

      {/* Sticky Bottom Row Buttons */}
      <div className="fixed bottom-3 left-3 right-3 z-10 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate({ to: ROUTES.CONTACT_ADD_EXPENSE, params: { id: userId } })}
          className="flex-1 h-12 rounded-full bg-positive text-white font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
        >
          Add Expense
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: ROUTES.SETTLE_UP, search: { contactId: userId } })}
          className="flex-1 h-12 rounded-full bg-[#FDB105] text-[#1A1A1A] font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
        >
          Settle Up
        </button>
      </div>
    </div>
  )
}
