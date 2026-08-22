import { useCallback, useMemo } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Bell, MoreVertical } from 'lucide-react'
import ContactAvatar from '@/components/shared/contact-avatar'
import { ROUTES } from '@/constants/routes'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import FlowHeader from '@/components/shared/flow-header'
import ExpenseList, { type ExpenseListData } from '@/components/shared/expense-list'
import EmptyState from '@/components/shared/empty-state'
import ExpenseListSkeleton from '@/components/shared/expense-list-skeleton'
import InfiniteScrollSentinel from '@/components/shared/infinite-scroll-sentinel'
import { Skeleton } from '@/components/ui/skeleton'
import { useContactLedgers } from '@/features/contacts/hooks/use-contact-ledgers'
import { useFriendshipTransactionsQuery } from '@/features/contacts/api/use-friendship-transactions-query'
import { useFriendshipDetailQuery } from '@/features/contacts/api/use-friendship-detail-query'
import { useToggleReactionMutation } from '@/features/groups/api/use-reaction-mutation'

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

function getDateCategory(dateStr: string): 'Today' | 'Yesterday' | 'Earlier' {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)

  let d: Date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, day] = dateStr.split('-').map(Number)
    d = new Date(y, m - 1, day)
  } else {
    d = new Date(dateStr)
  }

  const txDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (txDate.getTime() === today.getTime()) return 'Today'
  if (txDate.getTime() === yesterday.getTime()) return 'Yesterday'
  return 'Earlier'
}

function formatRightSubtitle(dateISO: string, category: 'Today' | 'Yesterday' | 'Earlier'): string {
  const d = new Date(dateISO)
  if (isNaN(d.getTime())) return dateISO

  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  if (category === 'Today' || category === 'Yesterday') {
    return timeStr
  }

  const now = new Date()
  const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24)
  if (diffDays < 7) {
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
    return `${dayName}, ${timeStr}`
  }

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface ExpenseListItemWithDate extends ExpenseListData {
  dateISO: string
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
  const friendshipQuery = useFriendshipDetailQuery(ledgers.friendshipId)

  const items: ExpenseListItemWithDate[] = useMemo(() => {
    if (!transactions.data) return []
    return transactions.data.map((t) => {
      const rawDateStr = t.kind === 'expense' ? (t.data.created_at || t.data.date) : (t.data.created_at || t.data.date)
      const dateCat = getDateCategory(t.data.date)
      const rightSub = formatRightSubtitle(rawDateStr, dateCat)

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
          categoryIcon: t.data.category.icon,
          categoryColor: t.data.category.color,
          rightSubtitle: rightSub,
          showChevron: true,
          amountColor: 'default' as const,
          kind: 'expense' as const,
          dateISO: t.data.date,
          reactions: t.data.reactions ?? [],
        }
      }
      const isConfirmed = t.data.status === 'confirmed'
      const isPending = t.data.status === 'pending'
      const isAdjustment = t.data.method === 'adjustment'
      const otherUserId = ledgers.data?.other_user.id
      const paymentSummary = t.data.payer.id === otherUserId
        ? `${t.data.payer.full_name} paid you`
        : `You paid ${t.data.payee.full_name}`
      const adjustmentSummary = t.data.payer.id === otherUserId
        ? `${t.data.payer.full_name} adjusted this with you`
        : `You adjusted this with ${t.data.payee.full_name}`

      return {
        id: t.data.id,
        name: isAdjustment ? 'Balance adjusted' : isConfirmed ? 'Payment settled' : isPending ? 'Payment pending' : 'Payment disputed',
        subtitle: isAdjustment
          ? `${adjustmentSummary}\nNo payment made`
          : isConfirmed ? `${paymentSummary}\nBalance settled` : paymentSummary,
        amount: Number(t.data.amount),
        currency: t.data.currency,
        category: isAdjustment ? 'adjustment' as const : isConfirmed ? 'payment' as const : 'other' as const,
        rightSubtitle: rightSub,
        showChevron: !isConfirmed,
        amountColor: isConfirmed ? 'green' as const : isPending ? 'orange' as const : 'black' as const,
        className: isAdjustment
          ? 'bg-[#EDE7F6] hover:bg-[#EDE7F6]/90'
          : isConfirmed ? 'bg-[#DCEFE4] hover:bg-[#DCEFE4]/90' : undefined,
        kind: 'settlement' as const,
        dateISO: t.data.date,
        reactions: t.data.reactions ?? [],
      }
    })
  }, [transactions.data, ledgers.data])

  const groupedItems = useMemo(() => {
    const groups: Record<'Today' | 'Yesterday' | 'Earlier', ExpenseListItemWithDate[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    }

    items.forEach((item) => {
      const cat = getDateCategory(item.dateISO)
      groups[cat].push(item)
    })

    // Newest-first, matching the underlying feed's order (see
    // use-friendship-transactions-query.ts's sort: 'newest').
    const list: { category: 'Today' | 'Yesterday' | 'Earlier'; expenses: ExpenseListItemWithDate[] }[] = []
    if (groups.Today.length > 0) list.push({ category: 'Today', expenses: groups.Today })
    if (groups.Yesterday.length > 0) list.push({ category: 'Yesterday', expenses: groups.Yesterday })
    if (groups.Earlier.length > 0) list.push({ category: 'Earlier', expenses: groups.Earlier })

    return list
  }, [items])

  // Stable identity required for ExpenseItem's memo() to actually skip
  // re-rendering rows on unrelated state changes — see expense-item.tsx.
  const handleItemClick = useCallback((tid: string | number, kind?: 'expense' | 'settlement') => {
    if (kind === 'settlement') {
      navigate({ to: ROUTES.SETTLEMENT_DETAILS, params: { id: tid.toString() } })
    } else {
      navigate({ to: ROUTES.TRANSACTION_DETAILS, params: { id: tid.toString() } })
    }
  }, [navigate])

  const toggleReaction = useToggleReactionMutation()
  const handleReact = useCallback((tid: string | number, kind: 'expense' | 'settlement' | undefined, emoji: string) => {
    toggleReaction.mutate({ id: tid.toString(), kind: kind ?? 'expense', emoji, friendshipId: ledgers.friendshipId })
  }, [toggleReaction, ledgers.friendshipId])

  if (ledgers.isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#FEFAF1]">
        <div className="flex shrink-0 items-center gap-3 px-6 pb-3 pt-5">
          <Skeleton className="size-11 rounded-full shrink-0" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="mb-4 shrink-0 px-6">
          <div className="bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] p-6 flex flex-col gap-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-36" />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden px-6">
          <ExpenseListSkeleton />
        </div>
      </div>
    )
  }

  if (ledgers.isError || !ledgers.data) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center bg-[#FEFAF1] p-6">
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

  const { other_user: otherUser, ledgers: ledgerItems } = ledgers.data
  // This screen and its transaction history are scoped to the direct
  // friendship. Cross-group totals belong on ContactBreakdownScreen.
  const primaryBalance = ledgerItems.find((item) => item.scope === 'friendship')
  const amount = primaryBalance ? Number(primaryBalance.net_amount) : 0
  const isPositive = primaryBalance?.direction === 'owed_to_you'
  const isNegative = primaryBalance?.direction === 'you_owe'
  const currency = primaryBalance?.currency ?? 'PKR'
  const formattedVal = formatCurrency(amount, currency)

  const statusLabel = isPositive ? 'You will receive' : isNegative ? 'You owe' : 'Settled up'
  const amountColorClass = isPositive ? 'text-positive' : isNegative ? 'text-[#C96A1B]' : 'text-[#1A1A1A]'
  const initials = initialsForName(otherUser.full_name)

  const showRemindButton = isPositive && amount > 0
  const isBlocked = friendshipQuery.data?.is_blocked ?? false

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#FEFAF1] select-none">
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
        rightSlot={
          <button
                      type="button"
                      onClick={() => navigate({ to: ROUTES.CONTACT_SETTINGS, params: { id: userId } })}
                      className="text-[#6B6B6B] cursor-pointer border-0 bg-transparent flex items-center justify-center p-2"
                    >
                      <MoreVertical size={20} />
                    </button>
        }
      />

      {/* Direct 1-to-1 Balance Stat Card */}
      <div className="mb-4 shrink-0 px-6">
        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex items-center justify-between">
          <div className="flex flex-col text-left">
            <span className="text-[#6B6B6B] text-[13px] font-semibold">{statusLabel}</span>
            <span className={cn('text-3xl font-extrabold mt-2 leading-none tracking-tight', amountColorClass)}>
              {formattedVal}
            </span>
          </div>
          {showRemindButton && (
            <button
              type="button"
              disabled={isBlocked}
              onClick={() => navigate({ to: ROUTES.CONTACT_REMINDER, params: { id: userId } })}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#0B683A4D] bg-[#E4F2EB] text-positive text-xs font-bold transition-all hover:bg-[#E4F2EB]/80 shrink-0 cursor-pointer outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#E4F2EB]"
              title={isBlocked ? 'Unblock this ledger to send reminders' : undefined}
            >
              <Bell size={13} className="text-positive" strokeWidth={2.5} />
              Remind
            </button>
          )}
        </div>
      </div>

      {/* Transaction history grouped by Today, Yesterday, Earlier */}
      <div className="flex min-h-0 flex-1 touch-pan-y flex-col gap-6 overflow-y-auto overscroll-y-contain px-6 pb-4">
        {transactions.isLoading && <ExpenseListSkeleton />}
        {transactions.isError && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">Couldn’t load transactions.</p>
            <button
              type="button"
              onClick={() => void transactions.refetch()}
              className="border-0 bg-transparent text-sm font-bold text-primary cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}
        {!transactions.isLoading && !transactions.isError && items.length === 0 && (
          <EmptyState
            title="No transactions yet"
            description={isBlocked
              ? 'This ledger is blocked. Existing history remains visible, but new activity is disabled.'
              : 'Add an expense to start tracking transactions with this contact.'}
            // actionLabel={isBlocked ? undefined : 'Add Expense'}
            // onAction={isBlocked
            //   ? undefined
            //   : () => navigate({ to: ROUTES.CONTACT_ADD_EXPENSE, params: { id: userId } })}
            className="py-6"
          />
        )}
        {items.length > 0 && (
          <>
            {groupedItems.map((group) => (
              <div key={group.category} className="flex flex-col gap-2">
                <h4 className="text-[13px] font-semibold text-[#6B6B6B] px-1">
                  {group.category}
                </h4>
                <ExpenseList
                  expenses={group.expenses}
                  onItemClick={handleItemClick}
                  onItemReact={handleReact}
                />
              </div>
            ))}
            <InfiniteScrollSentinel
              onLoadMore={transactions.fetchNextPage}
              hasMore={transactions.hasNextPage}
              isLoading={transactions.isFetchingNextPage}
            />
          </>
        )}
      </div>

      {/* #root owns the real OS inset exactly once. This bar only adds its
          normal visual spacing: 12px with gesture/no navigation controls,
          while Android three-button navigation or the iOS home indicator
          increases the space through #root's runtime safe-area padding. */}
      <div className="z-10 flex shrink-0 items-center gap-3 bg-[#FEFAF1] px-3 pb-3 pt-3">
        <button
          type="button"
          disabled={isBlocked}
          onClick={() => navigate({ to: ROUTES.CONTACT_ADD_EXPENSE, params: { id: userId } })}
          className="flex-1 h-12 rounded-full bg-positive text-white font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0 disabled:bg-[#C9CEC9] disabled:text-white/90 disabled:cursor-not-allowed disabled:hover:opacity-100 disabled:active:scale-100"
          title={isBlocked ? 'Unblock this ledger to add expenses' : undefined}
        >
          Add Expense
        </button>
        <button
          type="button"
          disabled={isBlocked}
          onClick={() => navigate({ to: ROUTES.SETTLE_UP, search: { contactId: userId } })}
          className="flex-1 h-12 rounded-full bg-[#FDB105] text-[#1A1A1A] font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0 disabled:bg-[#DEDAD0] disabled:text-[#8D8A84] disabled:cursor-not-allowed disabled:hover:opacity-100 disabled:active:scale-100"
          title={isBlocked ? 'Unblock this ledger to settle up' : undefined}
        >
          Settle Up
        </button>
      </div>
    </div>
  )
}
