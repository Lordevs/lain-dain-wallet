import { useMemo } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Bell, MoreVertical } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useGroupQuery } from '@/features/groups/api/use-group-query'
import { useGroupBalanceQuery } from '@/features/groups/api/use-group-balance-query'
import { useGroupTransactionsQuery } from '@/features/groups/api/use-group-transactions-query'
import { useAuthStore } from '@/store/use-auth-store'

/**
 * GroupDetailScreen — real ledger view for one group: per-member
 * balances plus the merged expense/settlement transaction history.
 * Mirrors ContactDetailScreen's structure for the 1:1 case.
 */
export default function GroupDetailScreen() {
  const { id: groupId } = useParams({ from: '/groups/$id/' })
  const navigate = useNavigate({ from: '/groups/$id/' })

  const groupQuery = useGroupQuery(groupId)
  const balanceQuery = useGroupBalanceQuery(groupId)
  const transactionsQuery = useGroupTransactionsQuery(groupId)
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
      }
    })
  }, [transactionsQuery.data, myId])

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
  const activeMembers = group.members.filter((m) => m.status === 'active')
  const balances = balanceQuery.data ?? []

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

      <div className="flex-1 overflow-y-auto px-6 pb-12 flex flex-col gap-6">
        {/* Balances Section */}
        {balances.length > 0 && (
          <div className="flex flex-col text-left">
            <div className="flex items-center justify-between mb-3 mt-1">
              <h3 className="text-sm font-bold text-[#1A1A1A]">Balances</h3>
              {balances.some((b) => b.direction === 'owed_to_you') && (
                <button
                  type="button"
                  onClick={() => navigate({ to: ROUTES.GROUP_REMINDER, params: { id: groupId } })}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#0B683A4D] bg-[#E4F2EB] text-positive text-xs font-bold transition-all hover:bg-[#E4F2EB]/80 shrink-0 cursor-pointer outline-none"
                >
                  <Bell size={13} className="text-positive" strokeWidth={2.5} />
                  Remind
                </button>
              )}
            </div>
            <ContactList>
              {balances.map((b) => {
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
          <h3 className="text-sm font-bold text-[#1A1A1A]">
            Expenses <span className="text-[#6B6B6B] font-medium">({items.length} items)</span>
          </h3>
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
                onItemClick={(tid, kind) =>
                  kind === 'settlement'
                    ? navigate({ to: ROUTES.SETTLEMENT_DETAILS, params: { id: tid.toString() } })
                    : navigate({ to: ROUTES.TRANSACTION_DETAILS, params: { id: tid.toString() } })
                }
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
      <div className="fixed bottom-3 left-3 right-3 z-10 flex items-center gap-4">
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
