import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { ChevronDown, ChevronUp, ListFilter, MoreVertical } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { colorForName, initialsForName } from '@/lib/avatar-visuals'
import FlowHeader from '@/components/shared/flow-header'
import ContactAvatar from '@/components/shared/contact-avatar'
import ContactList from '@/components/shared/contact-list'
import ContactListItem from '@/components/shared/contact-list-item'
import ExpenseList, { type ExpenseListData } from '@/components/shared/expense-list'
import EmptyState from '@/components/shared/empty-state'
import ExpenseListSkeleton from '@/components/shared/expense-list-skeleton'
import InfiniteScrollSentinel from '@/components/shared/infinite-scroll-sentinel'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGroupQuery } from '@/features/groups/api/use-group-query'
import { useGroupBalanceQuery } from '@/features/groups/api/use-group-balance-query'
import {
  useGroupTransactionsQuery,
  type GroupSortBy,
  type GroupTransactionFilter,
} from '@/features/groups/api/use-group-transactions-query'
import { useToggleReactionMutation } from '@/features/groups/api/use-reaction-mutation'
import { useAuthStore } from '@/store/use-auth-store'
import GroupCategoryFilterPills from './components/group-category-filter-pills'
import GroupExpensesFilterDrawer from './components/group-expenses-filter-drawer'

// Only mounted once the group actually has balances (see balances.length
// check below) — lazy-loading keeps framer-motion's chunk (unused
// anywhere else on this screen) out of the initial fetch entirely for a
// fully-settled group, and off the critical path otherwise.
const GroupBalanceCarousel = lazy(() => import('./components/group-balance-carousel'))

const MAX_VISIBLE_BALANCES = 3

/**
 * GroupDetailScreen — real ledger view for one group: per-member
 * balances plus the merged expense/settlement transaction history.
 * Mirrors ContactDetailScreen's structure for the 1:1 case.
 */
export default function GroupDetailScreen() {
  const { id: groupId } = useParams({ from: '/groups/$id/' })
  const navigate = useNavigate({ from: '/groups/$id/' })
  const [showAllBalances, setShowAllBalances] = useState(false)
  const [sortBy, setSortBy] = useState<GroupSortBy>('newest')
  const [categoryFilter, setCategoryFilter] = useState<GroupTransactionFilter>('all')

  const groupQuery = useGroupQuery(groupId)
  const balanceQuery = useGroupBalanceQuery(groupId)
  const transactionsQuery = useGroupTransactionsQuery(groupId, sortBy, categoryFilter)
  const myId = useAuthStore((state) => state.userProfile?.id)

  const items: ExpenseListData[] = useMemo(() => {
    if (!transactionsQuery.data) return []
    return transactionsQuery.data.map((t) => {
      if (t.kind === 'expense') {
        const payerNames = t.data.payers.length > 1 ? 'Split payment' : t.data.payers[0]?.full_name
        return {
          id: t.data.id,
          name: t.data.description,
          subtitle: payerNames ? `${payerNames} paid` : 'Paid',
          amount: Number(t.data.amount),
          currency: t.data.currency,
          categoryIcon: t.data.category.icon,
          categoryColor: t.data.category.color,
          rightSubtitle: new Date(t.data.date).toLocaleDateString(),
          showChevron: true,
          amountColor: 'default' as const,
          kind: 'expense' as const,
          reactions: t.data.reactions ?? [],
        }
      }
      const isConfirmed = t.data.status === 'confirmed'
      const isPending = t.data.status === 'pending'
      const payerName = t.data.payer.id === myId ? 'You' : t.data.payer.full_name
      const payeeName = t.data.payee.id === myId ? 'you' : t.data.payee.full_name
      const paymentSummary = `${payerName} paid ${payeeName}`

      return {
        id: t.data.id,
        name: isConfirmed ? 'Payment settled' : isPending ? 'Payment pending' : 'Payment disputed',
        subtitle: isConfirmed ? `${paymentSummary}\nBalance adjusted` : paymentSummary,
        amount: Number(t.data.amount),
        currency: t.data.currency,
        category: isConfirmed ? 'payment' as const : 'other' as const,
        rightSubtitle: new Date(t.data.created_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        showChevron: !isConfirmed,
        amountColor: isConfirmed ? 'green' as const : isPending ? 'orange' as const : 'black' as const,
        className: isConfirmed ? 'bg-[#DCEFE4] hover:bg-[#DCEFE4]/90' : undefined,
        kind: 'settlement' as const,
        reactions: t.data.reactions ?? [],
      }
    })
  }, [transactionsQuery.data, myId])

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
    toggleReaction.mutate({ id: tid.toString(), kind: kind ?? 'expense', emoji, groupId })
  }, [toggleReaction, groupId])

  if (groupQuery.isLoading) {
    return (
      <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-24">
        <div className="flex items-center gap-3 px-6 pt-5 pb-3">
          <Skeleton className="size-11 rounded-full shrink-0" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="px-6 mb-6">
          <div className="bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] p-6 flex flex-col gap-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-36" />
          </div>
        </div>
        <div className="px-6">
          <ExpenseListSkeleton />
        </div>
      </div>
    )
  }

  const group = groupQuery.data
  if (groupQuery.isError || !group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#FEFAF1]">
        <p className="text-muted-foreground text-sm mb-4">Couldn't load this group.</p>
        <button
          onClick={() => navigate({ to: ROUTES.DASHBOARD })}
          className="text-primary font-bold hover:underline border-0 bg-transparent cursor-pointer"
        >
          Go Back
        </button>
      </div>
    )
  }

  const groupInitials = initialsForName(group.name)
  const groupAvatarColor = colorForName(group.name)
  // Every entry in group.members is already an active membership — adds
  // are immediate now, no more pending/invited members to filter out.
  const activeMembers = group.members
  const balances = balanceQuery.data ?? []
  const visibleBalances = showAllBalances ? balances : balances.slice(0, MAX_VISIBLE_BALANCES)

  // Single-currency assumption, matching every other amount already shown
  // on this screen (per-member rows format with their own b.currency, but
  // nothing on this screen sums across currencies elsewhere either).
  const totalReceivable = balances
    .filter((b) => b.direction === 'owed_to_you')
    .reduce((sum, b) => sum + Number(b.net_amount), 0)
  const totalPayable = balances
    .filter((b) => b.direction === 'you_owe')
    .reduce((sum, b) => sum + Number(b.net_amount), 0)
  const netAmount = totalReceivable - totalPayable

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-24 relative select-none">
      <FlowHeader
        title={group.name}
        subtitle={`${activeMembers.length} member${activeMembers.length === 1 ? '' : 's'}`}
        backVariant="minimal"
        avatar={
          <ContactAvatar
            initials={groupInitials}
            avatarColor={groupAvatarColor}
            src={group.image ?? undefined}
            size="md"
            className="size-11 text-sm font-bold"
          />
        }
        rightSlot={
          <button
            type="button"
            onClick={() => navigate({ to: ROUTES.GROUP_SETTINGS, params: { id: groupId } })}
            className="text-[#6B6B6B] cursor-pointer border-0 bg-transparent flex items-center justify-center p-2"
          >
            <MoreVertical size={20} />
          </button>
        }
      />

      {balances.length > 0 && (
        <Suspense fallback={null}>
          <GroupBalanceCarousel
            isReceivable={netAmount >= 0}
            formattedNetAmount={formatCurrency(Math.abs(netAmount), group.default_currency)}
            formattedReceivable={formatCurrency(totalReceivable, group.default_currency)}
            formattedPayable={formatCurrency(totalPayable, group.default_currency)}
            hasReceivable={totalReceivable > 0}
            onRemind={() => navigate({ to: ROUTES.GROUP_REMINDER, params: { id: groupId } })}
          />
        </Suspense>
      )}

      <div className="flex-1 overflow-y-auto px-6 pb-12 flex flex-col gap-6">
        {/* Balances Section */}
        {balances.length > 0 && (
          <div className="flex flex-col text-left">
            <div className="flex items-center justify-between mb-3 mt-1">
              <h3 className="text-sm font-bold text-[#1A1A1A]">Balances</h3>
              {balances.length > MAX_VISIBLE_BALANCES && (
                <button
                  type="button"
                  onClick={() => setShowAllBalances((prev) => !prev)}
                  className="flex items-center gap-1 text-xs font-bold text-positive bg-transparent border-0 cursor-pointer"
                >
                  {showAllBalances ? 'View less' : 'View all'}
                  {showAllBalances ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>
            <ContactList>
              {visibleBalances.map((b) => {
                const isReceivable = b.direction === 'owed_to_you'
                const initials = initialsForName(b.other_user.full_name)
                const avatarColor = colorForName(b.other_user.full_name)
                return (
                  <ContactListItem
                    key={b.other_user.id}
                    contact={{ id: b.other_user.id, name: b.other_user.full_name, initials, avatarColor }}
                    subtitle={
                      <span className={cn(isReceivable ? 'text-positive' : 'text-[#C96A1B]')}>
                        {isReceivable ? 'owes you' : b.direction === 'you_owe' ? 'you owe' : 'settled'}
                      </span>
                    }
                    rightSlot={
                      <span className={cn('text-[13px] font-black', isReceivable ? 'text-positive' : 'text-[#C96A1B]')}>
                        {formatCurrency(Math.abs(Number(b.net_amount)), b.currency)}
                      </span>
                    }
                    className="p-4 hover:bg-muted/5 transition-all bg-white"
                  />
                )
              })}
            </ContactList>
          </div>
        )}

        {/* Transaction history */}
        <div className="flex flex-col gap-3 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1A1A1A]">
              Expenses <span className="text-[#6B6B6B] font-medium">({items.length} items)</span>
            </h3>
            <GroupExpensesFilterDrawer sortBy={sortBy} onSortByChange={setSortBy}>
              <Button
                variant="outline"
                className={cn(
                  'w-9 h-9 rounded-full bg-white! border-[1.08px] border-border-card flex items-center justify-center text-muted-faint hover:text-foreground hover:bg-white transition-colors shadow-[0px_2px_8px_0px_#0000000A] p-0 shrink-0 cursor-pointer',
                  sortBy !== 'newest' && 'border-primary text-primary bg-primary/5 hover:bg-primary/5',
                )}
                aria-label="Sort"
              >
                <ListFilter size={16} strokeWidth={2} />
              </Button>
            </GroupExpensesFilterDrawer>
          </div>
          <GroupCategoryFilterPills value={categoryFilter} onChange={setCategoryFilter} />
          {transactionsQuery.isLoading && <ExpenseListSkeleton />}
          {!transactionsQuery.isLoading && items.length === 0 && (
            <EmptyState
              title="No transactions yet"
              description="Add an expense to start tracking this group's spending."
              actionLabel="Add Expense"
              onAction={() => navigate({ to: ROUTES.GROUP_ADD_EXPENSE, params: { id: groupId } })}
              className="py-6"
            />
          )}
          {items.length > 0 && (
            <>
              <ExpenseList
                expenses={items}
                onItemClick={handleItemClick}
                onItemReact={handleReact}
              />
              <InfiniteScrollSentinel
                onLoadMore={transactionsQuery.fetchNextPage}
                hasMore={transactionsQuery.hasNextPage}
                isLoading={transactionsQuery.isFetchingNextPage}
              />
            </>
          )}
        </div>
      </div>

      {/* Sticky Bottom Row Buttons */}
      <div className="safe-action-fixed z-10 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate({ to: ROUTES.GROUP_ADD_EXPENSE, params: { id: groupId } })}
          className="flex-1 h-12 rounded-full bg-primary text-white font-extrabold text-base cursor-pointer hover:bg-neutral-800 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
        >
          Add Expense
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: ROUTES.SETTLE_UP, search: { groupId } })}
          className="flex-1 h-12 rounded-full bg-[#FDB105] text-[#1A1A1A] font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
        >
          Settle Up
        </button>
      </div>
    </div>
  )
}
