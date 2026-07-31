import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { useGroupQuery } from '@/features/groups/api/use-group-query'
import { useGroupBalanceQuery } from '@/features/groups/api/use-group-balance-query'
import { useRequestSettlementMutation } from '@/features/notifications/api/use-notification-mutations'
import { formatCurrency } from '@/lib/currency'
import { colorForName, initialsForName } from '@/lib/avatar-visuals'
import { cn } from '@/lib/utils'
import FlowHeader from '@/components/shared/flow-header'
import SuccessCheck from '@/components/shared/success-check'
import ContactAvatar from '@/components/shared/contact-avatar'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * SendGroupReminderScreen — bulk "remind whoever owes you in this group"
 * flow. Each selected member gets their own POST /api/notifications/remind/
 * call (server always derives the amount itself — see
 * apps/expenses/services.py's request_settlement), same endpoint the 1:1
 * reminder screen uses.
 */
export default function SendGroupReminderScreen() {
  const { id: groupId } = useParams({ from: '/groups/$id/reminder' })
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [selected, setSelected] = useState<Set<string> | null>(null)

  const groupQuery = useGroupQuery(groupId)
  const balanceQuery = useGroupBalanceQuery(groupId)
  const requestSettlement = useRequestSettlementMutation()

  if (groupQuery.isLoading || balanceQuery.isLoading) {
    return (
      <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-20 relative select-none overflow-hidden text-[#1A1A1A]">
        <FlowHeader title="Send Reminder" onBack={() => window.history.back()} backVariant="circle" />
        <div className="px-6 mt-8 flex flex-col items-center gap-4">
          <Skeleton className="size-28 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    )
  }

  const group = groupQuery.data
  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-[#FEFAF1] select-none text-[#1A1A1A] h-[50vh]">
        <p className="text-muted-foreground text-sm mb-4">Group not found</p>
        <button
          onClick={() => window.history.back()}
          className="text-positive font-bold hover:underline border-0 bg-transparent cursor-pointer"
        >
          Close
        </button>
      </div>
    )
  }

  const owedRows = (balanceQuery.data ?? []).filter((b) => b.direction === 'owed_to_you')
  const selectedIds = selected ?? new Set(owedRows.map((r) => r.other_user.id))
  const allSelected = owedRows.length > 0 && owedRows.every((r) => selectedIds.has(r.other_user.id))
  const totalOutstanding = owedRows.reduce((sum, r) => sum + Number(r.net_amount), 0)
  const currency = owedRows[0]?.currency ?? group.default_currency

  const toggleMember = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const toggleSelectAll = () => {
    setSelected(allSelected ? new Set() : new Set(owedRows.map((r) => r.other_user.id)))
  }

  const handleSendReminder = async () => {
    if (selectedIds.size === 0 || isSending) return
    setIsSending(true)
    const ids = Array.from(selectedIds)
    const results = await Promise.allSettled(
      ids.map((otherUserId) => requestSettlement.mutateAsync({ other_user_id: otherUserId, group_id: groupId })),
    )
    setIsSending(false)

    const failures = results.filter((r) => r.status === 'rejected').length
    if (failures === results.length) {
      toast.error('Failed to send reminders. Please try again.')
      return
    }
    if (failures > 0) {
      toast.error(`Sent ${results.length - failures} of ${results.length} reminders — some failed.`)
    }
    setShowSuccess(true)
  }

  const handleSuccessComplete = () => {
    window.history.back()
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col flex-1 bg-[#FEFAF1] h-full select-none justify-center">
        <SuccessCheck onComplete={handleSuccessComplete} />
      </div>
    )
  }

  const groupInitials = initialsForName(group.name)
  const groupAvatarColor = colorForName(group.name)

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen pb-24 relative select-none overflow-hidden text-[#1A1A1A]">
      <FlowHeader title="Send Reminder" onBack={() => window.history.back()} backVariant="circle" />

      {/* Group profile section */}
      <div className="flex flex-col items-center py-8 px-6 shrink-0">
        <ContactAvatar
          initials={groupInitials}
          avatarColor={groupAvatarColor}
          src={group.image ?? undefined}
          size="lg"
          className="size-28 text-2xl font-extrabold shadow-[0px_4px_12px_rgba(11,104,58,0.08)] border border-positive/10"
        />
        <h2 className="mt-6 text-2xl font-extrabold text-[#1A1A1A] uppercase tracking-wide text-center">
          {group.name}
        </h2>
        <p className="mt-3 text-sm font-semibold text-[#6B6B6B]">
          total outstanding <span className="text-positive font-extrabold">{formatCurrency(totalOutstanding, currency)}</span>
        </p>
      </div>

      {owedRows.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-muted-foreground text-sm">Nobody owes you in this group right now.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6">
          <div className="rounded-2xl border-[0.8px] border-[#EFE7DD] bg-white overflow-hidden">
            {/* Select All row */}
            <button
              type="button"
              onClick={toggleSelectAll}
              className="w-full px-5 py-4 flex items-center gap-3 border-0 border-b border-[#F0EBE3] bg-transparent cursor-pointer outline-none"
            >
              <Checkbox checked={allSelected} />
              <span className="font-bold text-sm text-[#1A1A1A]">Select All</span>
            </button>

            {owedRows.map((row) => {
              const isSelected = selectedIds.has(row.other_user.id)
              const initials = initialsForName(row.other_user.full_name)
              const avatarColor = colorForName(row.other_user.full_name)
              return (
                <button
                  key={row.other_user.id}
                  type="button"
                  onClick={() => toggleMember(row.other_user.id)}
                  className="w-full px-5 py-4 flex items-center gap-3 border-0 border-b border-[#F0EBE3] last:border-b-0 bg-transparent cursor-pointer outline-none"
                >
                  <Checkbox checked={isSelected} />
                  <ContactAvatar
                    initials={initials}
                    avatarColor={avatarColor}
                    src={row.other_user.image ?? undefined}
                    size="sm"
                    className="size-9 text-xs font-bold"
                  />
                  <span className={cn('flex-1 text-left font-semibold text-sm', !isSelected && 'text-[#9A9590]')}>
                    {row.other_user.full_name}
                  </span>
                  <span className={cn('font-extrabold text-sm', isSelected ? 'text-[#1A1A1A]' : 'text-[#C9C4BD]')}>
                    {formatCurrency(Number(row.net_amount), row.currency)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Sticky Bottom Send Reminder button */}
      {owedRows.length > 0 && (
        <div className="fixed bottom-3 left-3 right-3 z-10">
          <button
            type="button"
            disabled={selectedIds.size === 0 || isSending}
            onClick={handleSendReminder}
            className="w-full h-14 rounded-full bg-[#FDB105] text-[#1A1A1A] font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending...' : 'Send Reminder'}
          </button>
        </div>
      )}
    </div>
  )
}

function Checkbox({ checked }: { checked: boolean }) {
  return checked ? (
    <div className="size-5 rounded-[6px] bg-positive flex items-center justify-center text-white shrink-0">
      <Check size={12} strokeWidth={4} className="text-white" />
    </div>
  ) : (
    <div className="size-5 rounded-[6px] border-[1.5px] border-[#D4CFC8] bg-transparent shrink-0" />
  )
}
