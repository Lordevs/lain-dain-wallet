import { useState, createElement } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, Pencil, Trash2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/store/use-auth-store'
import { useExpenseQuery } from '@/features/expenses/api/use-expense-query'
import { useDeleteExpenseMutation } from '@/features/expenses/api/use-delete-expense-mutation'
import { useGroupQuery } from '@/features/groups/api/use-group-query'
import { useGroupBalanceQuery } from '@/features/groups/api/use-group-balance-query'
import { useFriendshipBalanceQuery } from '@/features/contacts/api/use-friendship-balance-query'
import { resolveGroupRole } from '@/features/groups/lib/group-roles'
import { iconForCategory } from '@/features/expenses/lib/category-icons'
import { formatCurrency } from '@/lib/currency'
import ConfirmActionDrawer from '@/components/shared/confirm-action-drawer'
import { Skeleton } from '@/components/ui/skeleton'

export default function TransactionDetailScreen() {
  const { id } = useParams({ from: '/transactions/$id' })
  const navigate = useNavigate()
  const myId = useAuthStore((s) => s.userProfile?.id)

  const expenseQuery = useExpenseQuery(id)
  const groupQuery = useGroupQuery(expenseQuery.data?.group ?? undefined)
  const groupBalanceQuery = useGroupBalanceQuery(expenseQuery.data?.group ?? undefined)
  const friendshipBalanceQuery = useFriendshipBalanceQuery(expenseQuery.data?.friendship ?? undefined)
  const deleteExpense = useDeleteExpenseMutation()
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)

  if (expenseQuery.isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#FEFAF1]">
        <div className="flex items-center px-6 pt-5 pb-3">
          <Skeleton className="size-10 rounded-full" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 pb-6">
          <div className="bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] p-6 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-14 h-14 rounded-[18px] shrink-0" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] divide-y divide-[#EBEBEB] overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const expense = expenseQuery.data
  if (expenseQuery.isError || !expense) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center bg-[#FEFAF1] p-6 text-[#1A1A1A] select-none">
        <p className="text-muted-foreground text-sm mb-4">Transaction not found</p>
        <button
          onClick={() => {
            if (window.history.length > 1) window.history.back()
            else navigate({ to: ROUTES.DASHBOARD })
          }}
          className="text-primary font-bold hover:underline border-0 bg-transparent cursor-pointer"
        >
          Close
        </button>
      </div>
    )
  }

  // The other participant in a friendship expense — payers/splits carry
  // full user info directly, so there's no need for a separate contact
  // lookup the way the old mock version needed one.
  const otherParticipant = [...expense.payers, ...expense.splits].find((p) => p.id !== myId)
  const backTarget = otherParticipant
    ? { to: ROUTES.CONTACT_DETAILS, params: { id: otherParticipant.id } }
    : { to: ROUTES.DASHBOARD }

  const goBack = () => {
    if (window.history.length > 1) window.history.back()
    else navigate(backTarget as never)
  }

  const formattedAmount = formatCurrency(Number(expense.amount), expense.currency)
  const isOwnEntry = expense.added_by.id === myId
  const isGroupOwner = expense.context === 'group'
    && !!myId
    && resolveGroupRole(groupQuery.data, myId) === 'owner'
  const canManageExpense = expense.context === 'group'
    ? isOwnEntry || isGroupOwner
    : expense.context === 'friendship'
      ? isOwnEntry
      : true
  const hasOutstandingBalance = expense.context === 'group'
    ? (groupBalanceQuery.data ?? []).some((balance) => Number(balance.net_amount) !== 0)
    : expense.context === 'friendship'
      ? (friendshipBalanceQuery.data ?? []).some((balance) => Number(balance.net_amount) !== 0)
      : false
  const canSettleUp = expense.context === 'group'
    ? Boolean(expense.group)
    : expense.context === 'friendship'
      ? Boolean(expense.friendship && otherParticipant)
      : false

  const payerNames = expense.payers
    .map((p) => (p.id === myId ? 'You' : p.full_name))
    .join(', ')
  const paidByText = expense.payers.length > 1 ? `${payerNames} (split payment)` : `${payerNames} (full amount)`

  const mySplit = expense.splits.find((s) => s.id === myId)
  const myShare = mySplit ? Number(mySplit.amount_owed) + Number(mySplit.extra_amount) : 0

  const formattedDate = new Date(expense.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const handleDelete = () => {
    deleteExpense.mutate(
      { id: expense.id, friendshipId: expense.friendship ?? undefined, groupId: expense.group ?? undefined },
      {
        onSuccess: () => {
          navigate(backTarget as never)
        },
      },
    )
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#FEFAF1] text-[#1A1A1A] select-none">
      {/* Header */}
      <div className="flex items-center px-6 pt-5 pb-3 relative shrink-0">
        <button
          onClick={goBack}
          className="size-10 rounded-full bg-white border border-[#EBEBEB] flex items-center justify-center cursor-pointer shadow-[0px_2px_8px_rgba(0,0,0,0.04)] outline-none"
        >
          <ChevronLeft size={20} className="text-[#1A1A1A]" />
        </button>
        <h3 className="text-lg font-extrabold text-[#1A1A1A] absolute left-1/2 -translate-x-1/2">
          Expense Details
        </h3>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 pb-6">
        {/* Main Info Card */}
        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EFE7DD] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex flex-col text-left">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-[18px] flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${expense.category.color}15` }}
            >
              {createElement(iconForCategory(expense.category.icon), { size: 26, style: { color: expense.category.color }, strokeWidth: 1.5 })}
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[17px] text-[#1A1A1A] leading-none">
                {expense.description}
              </span>
              {otherParticipant && (
                <span className="text-[12px] text-[#6B6B6B] font-medium mt-1.5 leading-none">
                  {otherParticipant.full_name}
                </span>
              )}
            </div>
          </div>

          <span className="mt-6 max-w-full text-[clamp(24px,8vw,34px)] font-extrabold leading-none tracking-[-0.04em] text-[#1A1A1A] tabular-nums [overflow-wrap:anywhere]">
            {formattedAmount}
          </span>

          <span className="text-[13px] text-[#6B6B6B] font-semibold mt-3.5 leading-none">
            {paidByText}
          </span>
        </div>

        {/* Summary Card */}
        <div className="flex flex-col text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[15px] font-bold text-[#6B6B6B]">Summary</span>
          </div>

          <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EBEBEB] overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-medium text-[#6B6B6B]">Description</span>
              <span className="text-sm font-bold text-[#1A1A1A]">{expense.description}</span>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-medium text-[#6B6B6B]">Category</span>
              <span className="text-sm font-bold text-[#1A1A1A] flex items-center gap-1.5">
                {createElement(iconForCategory(expense.category.icon), { size: 14, style: { color: expense.category.color } })}
                {expense.category.name}
              </span>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-medium text-[#6B6B6B]">Date</span>
              <span className="text-sm font-bold text-[#1A1A1A]">{formattedDate}</span>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-medium text-[#6B6B6B]">Paid by</span>
              <span className="text-sm font-bold text-positive">{payerNames}</span>
            </div>

            <div className="px-5 py-3.5 flex items-center justify-between">
              <span className="text-sm font-medium text-[#6B6B6B]">Receipt</span>
              {expense.receipt ? (
                <a
                  href={expense.receipt}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#EBEBEB] bg-white text-[12px] font-bold text-[#6B6B6B] hover:bg-[#F7F5F0] transition-colors cursor-pointer outline-none active:scale-95 shadow-[0px_1px_3px_rgba(0,0,0,0.02)]"
                >
                  <FileText size={13} className="text-[#C0392B]" />
                  View Receipt
                </a>
              ) : (
                <span className="text-sm font-medium text-[#9A9590]">None</span>
              )}
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-medium text-[#6B6B6B]">Note</span>
              <span className="text-sm font-medium text-[#6B6B6B] line-clamp-1 truncate max-w-40">{expense.note || '—'}</span>
            </div>

            {mySplit && (
              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <span className="shrink-0 text-sm font-medium text-[#6B6B6B]">Your share</span>
                <span className="min-w-0 max-w-[65%] text-right text-sm font-extrabold text-[#1A1A1A] tabular-nums [overflow-wrap:anywhere]">
                  {formatCurrency(myShare, expense.currency)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* How It Was Split Section */}
        <div className="flex flex-col text-left mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              How it was split
            </span>
            <span className="text-[13px] font-bold text-[#1A1A1A] capitalize">
              {expense.split_type}
            </span>
          </div>

          <div className="bg-white border border-[#EFE7DD] rounded-[24px] divide-y divide-[#EFE7DD] overflow-hidden shadow-[0px_4px_16px_rgba(0,0,0,0.02)]">
            {expense.splits.map((split) => {
              const isMe = split.id === myId
              const shareAmount = Number(split.amount_owed) + Number(split.extra_amount)
              return (
                <div key={split.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full text-white flex items-center justify-center font-extrabold text-sm shadow-sm select-none',
                        isMe ? 'bg-positive' : 'bg-[#1E3A8A]',
                      )}
                    >
                      {split.full_name
                        .split(/\s+/)
                        .map((p) => p[0]?.toUpperCase())
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <span className="min-w-0 truncate text-sm font-bold text-[#1A1A1A]">{isMe ? 'You' : split.full_name}</span>
                  </div>
                  <span className={cn('max-w-[48%] shrink-0 text-right text-sm font-extrabold tabular-nums [overflow-wrap:anywhere]', isMe ? 'text-[#C96A1B]' : 'text-[#1A1A1A]')}>
                    {formatCurrency(shareAmount, expense.currency)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Group entries can only be changed by their creator or the owner. */}
        {canManageExpense && (
        <div className="flex w-full shrink-0 items-center gap-3 pb-2">
          <button
            type="button"
            onClick={() => navigate({ to: `/transactions/${expense.id}/edit` as never })}
            className="flex-1 h-14 rounded-[20px] bg-white border border-[#EFE7DD] text-[#6B6B6B] font-extrabold text-base cursor-pointer shadow-sm hover:bg-muted/5 transition-colors flex items-center justify-center gap-2 outline-none"
          >
            <Pencil size={18} className="text-[#6B6B6B]" />
            Edit
          </button>

          <button
            type="button"
            onClick={() => setIsConfirmDeleteOpen(true)}
            disabled={deleteExpense.isPending}
            className="flex-1 h-14 rounded-[20px] bg-[#FFF3F3] border border-[#C0392B40] text-[#C0392B] font-extrabold text-base cursor-pointer shadow-sm hover:bg-[#FFF3F3]/80 transition-colors flex items-center justify-center gap-2 outline-none disabled:opacity-60"
          >
            <Trash2 size={18} className="text-[#C0392B]" />
            {deleteExpense.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
        )}
      </div>

      {canSettleUp && hasOutstandingBalance && (
        <div className="z-10 shrink-0 px-3 pb-3 pt-3">
          <button
            type="button"
            onClick={() => navigate({
              to: ROUTES.SETTLE_UP,
              search: expense.context === 'group'
                ? { groupId: expense.group! }
                : { contactId: otherParticipant!.id },
            })}
            className="flex h-12 w-full items-center justify-center rounded-full border-0 bg-[#FDB105] text-base font-extrabold text-[#1A1A1A] transition-opacity active:opacity-90 cursor-pointer"
          >
            Settle Up
          </button>
        </div>
      )}

      {canManageExpense && <ConfirmActionDrawer
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title="Delete this expense"
        confirmTitle="Delete this expense permanently?"
        confirmDescription="This will remove it from the ledger and update both balances. This cannot be undone."
        buttonText="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />}
    </div>
  )
}
