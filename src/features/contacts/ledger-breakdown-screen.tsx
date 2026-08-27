import { useCallback } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Users, Smile } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import CompactAmount from '@/components/shared/compact-amount'
import ExpenseList, { type ExpenseListData } from '@/components/shared/expense-list'
import ContactAvatar from '@/components/shared/contact-avatar'
import FlowHeader from '@/components/shared/flow-header'
import { useContactLedgers } from '@/features/contacts/hooks/use-contact-ledgers'
import { useLedgerAdjustmentQuery } from '@/features/contacts/api/use-ledger-adjustment-query'
import AdjustBalancesCard from '@/features/contacts/components/adjust-balances-card'
import ExpenseListSkeleton from '@/components/shared/expense-list-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

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
 * LedgerBreakdownScreen — the itemized "ledgers" side of
 * GET /api/expenses/with/{user_id}/: every shared group plus the direct
 * 1:1, alongside the combined "overall" total ContactDetailScreen shows.
 */
export default function LedgerBreakdownScreen() {
  const { id: userId } = useParams({ from: '/contacts/$id/breakdown' })
  const navigate = useNavigate()

  const ledgers = useContactLedgers(userId)
  const adjustmentQuery = useLedgerAdjustmentQuery(userId)

  // Stable identity required for ExpenseItem's memo() to actually skip
  // re-rendering rows on unrelated state changes — see expense-item.tsx.
  // Declared before the early returns below to respect the Rules of Hooks.
  const handleItemClick = useCallback((itemId: string | number) => {
    const idStr = String(itemId)
    if (idStr.startsWith('group-')) {
      const groupId = idStr.slice('group-'.length)
      navigate({ to: ROUTES.GROUP_DETAILS, params: { id: groupId } })
    } else {
      navigate({ to: ROUTES.CONTACT_DETAILS, params: { id: userId } })
    }
  }, [navigate, userId])

  if (ledgers.isLoading) {
    return (
      <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-10">
        <div className="flex items-center gap-3 px-6 pt-5 pb-3">
          <Skeleton className="size-11 rounded-full shrink-0" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="px-6 mb-6 mt-4">
          <div className="bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] p-6 flex flex-col gap-3">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="px-6">
          <Skeleton className="h-5 w-40 mb-3" />
          <ExpenseListSkeleton rows={3} />
        </div>
      </div>
    )
  }

  if (ledgers.isError || !ledgers.data) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
        <p className="text-muted-foreground text-sm mb-4">Couldn't load this contact.</p>
        <button
          onClick={() => window.history.back()}
          className="text-primary font-bold hover:underline border-0 bg-transparent cursor-pointer"
        >
          Close
        </button>
      </div>
    )
  }

  const { other_user: otherUser, overall, ledgers: ledgerItems } = ledgers.data
  const adjustment = adjustmentQuery.data?.find((a) => Number(a.adjustable_amount) > 0)
  const primaryBalance = overall[0]
  const overallAmount = primaryBalance ? Number(primaryBalance.net_amount) : 0
  const isPositive = primaryBalance?.direction === 'owed_to_you'
  const isNegative = primaryBalance?.direction === 'you_owe'
  const overallCurrency = primaryBalance?.currency ?? 'PKR'

  const overallAmountColorClass = isPositive
    ? 'text-positive'
    : isNegative
      ? 'text-[#C96A1B]'
      : 'text-[#1A1A1A]'

  const listItems: ExpenseListData[] = ledgerItems.map((item) => {
    const isGroup = item.scope === 'group'
    const firstName = otherUser.full_name.split(' ')[0]
    const subtitleText =
      item.direction === 'owed_to_you'
        ? `${firstName} owes you`
        : item.direction === 'you_owe'
          ? `You owe ${firstName}`
          : 'Settled up'

    return {
      id: isGroup ? `group-${item.group_id}` : `friendship-${item.friendship_id}`,
      name: item.label,
      amount: Number(item.net_amount),
      currency: item.currency,
      subtitle: subtitleText,
      amountColor: item.direction === 'owed_to_you' ? 'green' : item.direction === 'you_owe' ? 'orange' : 'black',
      showChevron: true,
      leftSlot: (
        <div
          className={cn(
            'w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0',
            isGroup ? 'bg-[#FFF3E6]' : 'bg-[#E3F2FD]',
          )}
        >
          {isGroup ? (
            <Smile size={18} className="text-[#C96A1B]" />
          ) : (
            <Users size={18} className="text-[#1E3A8A]" />
          )}
        </div>
      ),
    }
  })

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-10 relative select-none text-[#1A1A1A]">
      <FlowHeader
        title={otherUser.full_name}
        onBack={() => window.history.back()}
        backVariant="minimal"
        avatar={
          <div className="relative shrink-0 flex items-center">
            <ContactAvatar
              initials={initialsForName(otherUser.full_name)}
              avatarColor="bg-[#E3F2FD] text-[#1E3A8A]"
              src={otherUser.image ?? undefined}
              size="md"
              className="size-11 text-sm font-bold"
            />
          </div>
        }
      />

      {/* Overall Summary Card */}
      <div className="px-6 mb-6 mt-4">
        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex items-center justify-between">
          <div className="flex flex-col text-left">
            <div className="flex items-baseline gap-2">
              <CompactAmount
                amount={Math.abs(overallAmount)}
                currency={overallCurrency}
                drawerTitle="Overall Balance"
                className={cn('max-w-full text-[36px] font-black leading-none tracking-tight tabular-nums', overallAmountColorClass)}
              />
              <span className="text-[#6B6B6B] text-base font-semibold">overall</span>
            </div>
            <span className="text-[#6B6B6B] text-xs font-medium mt-2">
              Net across {ledgerItems.length} ledger{ledgerItems.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="px-6 flex flex-col gap-5 text-left">
        <div className="flex flex-col text-left">
          <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-3">Breakdown by ledger</h3>
          {listItems.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No shared ledgers yet.</p>
          ) : (
            <ExpenseList
              expenses={listItems}
              onItemClick={handleItemClick}
              className="border-[#EFE7DD] divide-[#EFE7DD]"
            />
          )}
        </div>

        {adjustment && (
          <AdjustBalancesCard
            adjustableAmount={Number(adjustment.adjustable_amount)}
            currency={adjustment.currency}
            onAdjustClick={() => navigate({ to: ROUTES.CONTACT_ADJUST_BALANCES, params: { id: userId } })}
          />
        )}
      </div>
    </div>
  )
}
