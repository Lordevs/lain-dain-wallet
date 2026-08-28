import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Check, X as XIcon, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import FlowHeader from '@/components/shared/flow-header'
import ContactAvatar from '@/components/shared/contact-avatar'
import ConfirmActionDrawer from '@/components/shared/confirm-action-drawer'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/use-auth-store'
import { useSettlementQuery } from './api/use-settlement-query'
import {
  useConfirmSettlementMutation,
  useDisputeSettlementMutation,
  useCancelSettlementMutation,
} from './api/use-settlement-action-mutations'
import { initialsForName, colorForName } from '@/lib/avatar-visuals'
import { formatCurrency } from '@/lib/currency'
import type { components } from '@/lib/api/schema'

type SettlementRead = components['schemas']['SettlementRead']

const METHOD_LABEL: Record<string, string> = {
  cash: 'Cash', bank_transfer: 'Bank Transfer', easypaisa: 'Easypaisa', jazzcash: 'JazzCash', other: 'Other',
  adjustment: 'Balance Adjustment',
}

const STATUS_STYLE: Record<SettlementRead['status'] & string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-[#FFF3E0] text-[#C96A1B]' },
  confirmed: { label: 'Confirmed', className: 'bg-[#ECF6F0] text-positive' },
  disputed: { label: 'Disputed', className: 'bg-[#FFF0F0] text-[#EB5757]' },
}

export default function SettlementDetailScreen() {
  const { id } = useParams({ from: '/settlements/$id' })
  const settlementQuery = useSettlementQuery(id)

  if (settlementQuery.isLoading) {
    return (
      <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen px-6 pt-5 gap-5">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-40 rounded-[24px]" />
        <Skeleton className="h-32 rounded-[24px]" />
      </div>
    )
  }

  const settlement = settlementQuery.data

  if (settlementQuery.isError || !settlement) {
    return (
      <div className="flex items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
        <div className="text-center">
          <p className="text-lg font-bold text-[#1A1A1A]">Settlement not found</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-positive text-white rounded-full font-bold border-0 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return <SettlementDetailBody settlement={settlement} />
}

function SettlementDetailBody({ settlement }: { settlement: SettlementRead }) {
  const userProfile = useAuthStore((state) => state.userProfile)
  const myId = userProfile?.id ?? ''

  const confirmMutation = useConfirmSettlementMutation()
  const disputeMutation = useDisputeSettlementMutation()
  const cancelMutation = useCancelSettlementMutation()

  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [actionToConfirm, setActionToConfirm] = useState<'dispute' | 'cancel' | null>(null)

  const isPayer = settlement.payer.id === myId
  const counterpart = isPayer ? settlement.payee : settlement.payer
  const amount = Number(settlement.amount)
  const statusStyle = STATUS_STYLE[settlement.status ?? 'pending']
  const isAdjustment = settlement.method === 'adjustment'

  const narrative = isAdjustment
    ? `Balance adjusted with ${counterpart.full_name}`
    : isPayer
      ? `You paid ${counterpart.full_name}`
      : `${counterpart.full_name} paid you`

  const isBusy = confirmMutation.isPending || disputeMutation.isPending || cancelMutation.isPending

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    setConfirmError(null)
    try {
      await action()
      toast.success(successMessage)
      window.history.back()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setConfirmError(message)
      toast.error(message)
    }
  }

  const handleConfirm = () => runAction(() => confirmMutation.mutateAsync(settlement.id), 'Payment confirmed')
  const handleDispute = () => runAction(() => disputeMutation.mutateAsync(settlement.id), 'Settlement disputed')
  const handleCancel = () =>
    runAction(
      () => cancelMutation.mutateAsync({ id: settlement.id, friendshipId: settlement.friendship, groupId: settlement.group }),
      'Settlement cancelled'
    )

  const initials = initialsForName(counterpart.full_name)
  const avatarColor = colorForName(counterpart.full_name)

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#FEFAF1] text-left select-none">
      <FlowHeader title="Settlement" onBack={() => window.history.back()} backVariant="circle" />

      <div className="flex flex-col gap-5 px-6 pb-10 pt-4">
        {/* Summary card */}
        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 flex flex-col items-center text-center gap-3">
          <ContactAvatar initials={initials} avatarColor={avatarColor} src={counterpart.image ?? undefined} size="lg" />
          <span className="font-extrabold text-[16px] text-[#1A1A1A]">{narrative}</span>
          <span className={cn(
            'text-[32px] font-extrabold leading-none tracking-tight',
            isAdjustment ? 'text-[#6C4FCE]' : isPayer ? 'text-[#C96A1B]' : 'text-positive',
          )}>
            {formatCurrency(amount, settlement.currency)}
          </span>
          <span className={cn('text-[11px] font-bold px-3 py-1 rounded-full', statusStyle.className)}>
            {statusStyle.label}
          </span>
        </div>

        {/* Meta rows */}
        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EBEBEB] overflow-hidden">
          <div className="p-5 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#6B6B6B]">Method</span>
            <span className="text-[14px] font-bold text-[#1A1A1A]">{METHOD_LABEL[settlement.method ?? 'cash']}</span>
          </div>
          <div className="p-5 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#6B6B6B]">Date</span>
            <span className="text-[14px] font-bold text-[#1A1A1A]">
              {new Date(settlement.date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="p-5 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#6B6B6B]">Recorded by</span>
            <span className="text-[14px] font-bold text-[#1A1A1A]">
              {settlement.recorded_by.id === myId ? 'You' : settlement.recorded_by.full_name}
            </span>
          </div>
          {settlement.note && (
            <div className="p-5 flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-[#6B6B6B]">Note</span>
              <span className="text-[14px] font-medium text-[#1A1A1A]">{settlement.note}</span>
            </div>
          )}
          {settlement.receipt && (
            <a
              href={settlement.receipt}
              target="_blank"
              rel="noreferrer"
              className="p-5 flex items-center justify-between text-positive font-bold text-[14px]"
            >
              View receipt
            </a>
          )}
        </div>

        {settlement.status === 'pending' && settlement.needs_your_confirmation && (
          <div className="bg-[#FFF9E6] border-[1.11px] border-[#C85A0033] rounded-[20px] p-5 flex gap-3 text-left">
            <Clock size={18} className="text-tertiary shrink-0 mt-0.5" />
            <span className="text-[13px] font-semibold text-tertiary">
              {counterpart.full_name} says they paid you {formatCurrency(amount, settlement.currency)}. Confirm you received it, or dispute if this isn't right.
            </span>
          </div>
        )}

        {confirmError && (
          <div className="bg-[#FFF0F0] border border-[#EB575733] rounded-[16px] p-4 flex gap-2 text-left">
            <AlertTriangle size={16} className="text-[#EB5757] shrink-0 mt-0.5" />
            <span className="text-[13px] font-semibold text-[#EB5757]">{confirmError}</span>
          </div>
        )}
        {/* Actions */}
        <div className="mt-1 flex flex-col gap-3 pb-2">
        {settlement.needs_your_confirmation && (
          <>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isBusy}
              className="w-full h-14 rounded-full bg-positive text-white font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 outline-none border-0 disabled:opacity-50"
            >
              <Check size={18} strokeWidth={3} />
              {confirmMutation.isPending ? 'Confirming...' : 'Confirm Received'}
            </button>
            <button
              type="button"
              onClick={() => setActionToConfirm('dispute')}
              disabled={isBusy}
              className="w-full h-14 rounded-full bg-white border-[1.5px] border-[#EB575740] text-[#EB5757] font-bold text-base cursor-pointer hover:bg-[#FFF3F3]/50 transition-colors outline-none disabled:opacity-50"
            >
              {disputeMutation.isPending ? 'Disputing...' : 'Dispute'}
            </button>
          </>
        )}

        {!settlement.needs_your_confirmation && settlement.can_dispute && (
          <button
            type="button"
            onClick={() => setActionToConfirm('dispute')}
            disabled={isBusy}
            className="w-full h-14 rounded-full bg-white border-[1.5px] border-[#EB575740] text-[#EB5757] font-bold text-base cursor-pointer hover:bg-[#FFF3F3]/50 transition-colors outline-none disabled:opacity-50"
          >
            <XIcon size={18} className="inline mr-2" strokeWidth={3} />
            {disputeMutation.isPending ? 'Disputing...' : 'Dispute'}
          </button>
        )}

        {settlement.can_cancel && (
          <button
            type="button"
            onClick={() => setActionToConfirm('cancel')}
            disabled={isBusy}
            className="w-full h-14 rounded-full bg-white border-[1.5px] border-[#EBEBEB] text-[#6B6B6B] font-bold text-base cursor-pointer hover:bg-[#F5F5F5] transition-colors outline-none disabled:opacity-50"
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Settlement'}
          </button>
        )}
        </div>
      </div>

      <ConfirmActionDrawer
        isOpen={actionToConfirm === 'dispute'}
        onClose={() => setActionToConfirm(null)}
        title="Dispute this settlement"
        confirmTitle="Are you sure this payment is incorrect?"
        confirmDescription={
          settlement.status === 'confirmed'
            ? 'This marks the settlement as disputed and reverses its effect on the ledger. This cannot be undone.'
            : 'This rejects the payment claim before it affects the ledger. This cannot be undone.'
        }
        buttonText="Dispute Settlement"
        variant="danger"
        onConfirm={() => {
          void handleDispute()
        }}
      />

      <ConfirmActionDrawer
        isOpen={actionToConfirm === 'cancel'}
        onClose={() => setActionToConfirm(null)}
        title="Cancel this settlement"
        confirmTitle="Cancel this pending settlement?"
        confirmDescription="This permanently removes the pending payment claim. No balance has been changed yet."
        buttonText="Cancel Settlement"
        variant="danger"
        onConfirm={() => {
          void handleCancel()
        }}
      />
    </div>
  )
}
