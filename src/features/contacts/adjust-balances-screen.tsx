import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Info } from 'lucide-react'
import { Check } from 'lucide-react'
import FlowHeader from '@/components/shared/flow-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useContactLedgers } from '@/features/contacts/hooks/use-contact-ledgers'
import { useLedgerAdjustmentQuery } from '@/features/contacts/api/use-ledger-adjustment-query'
import { useApplyLedgerAdjustmentMutation } from '@/features/contacts/api/use-apply-ledger-adjustment-mutation'
import { formatCurrency } from '@/lib/currency'
import { ROUTES } from '@/constants/routes'
import type { components } from '@/lib/api/schema'

type LedgerAdjustment = components['schemas']['LedgerAdjustment']

export default function AdjustBalancesScreen() {
  const { id: userId } = useParams({ from: '/contacts/$id/adjust' })
  const navigate = useNavigate()

  const ledgers = useContactLedgers(userId)
  const adjustmentQuery = useLedgerAdjustmentQuery(userId)

  const isLoading = ledgers.isLoading || adjustmentQuery.isLoading

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen px-6 pt-5 gap-5">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-48 rounded-[24px]" />
      </div>
    )
  }

  const otherUser = ledgers.data?.other_user
  const match = adjustmentQuery.data?.[0]
  const adjustableAmount = match ? Number(match.adjustable_amount) : 0

  if (ledgers.isError || !ledgers.data || !otherUser || !match || adjustableAmount <= 0) {
    return (
      <div className="flex items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
        <div className="text-center">
          <p className="text-lg font-bold text-[#1A1A1A]">Nothing to adjust right now</p>
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

  return <AdjustBalancesBody userId={userId} otherName={otherUser.full_name} match={match} navigate={navigate} />
}

function AdjustBalancesBody({
  userId,
  otherName,
  match,
  navigate,
}: {
  userId: string
  otherName: string
  match: LedgerAdjustment
  navigate: ReturnType<typeof useNavigate>
}) {
  const applyAdjustment = useApplyLedgerAdjustmentMutation(userId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const ledgerKey = (row: LedgerAdjustment['ledgers'][number]) =>
    `${row.scope}:${row.friendship_id ?? row.group_id}`
  const allRows = match.ledgers.filter((row) => Number(row.net_amount) !== 0)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(allRows.map(ledgerKey)),
  )
  const selectedRows = allRows.filter((row) => selectedKeys.has(ledgerKey(row)))
  const selectedYouOwe = selectedRows.filter((row) => row.direction === 'you_owe')
  const selectedOwedToYou = selectedRows.filter((row) => row.direction === 'owed_to_you')
  const selectedAmount = Math.min(
    selectedYouOwe.reduce((sum, row) => sum + Math.abs(Number(row.net_amount)), 0),
    selectedOwedToYou.reduce((sum, row) => sum + Math.abs(Number(row.net_amount)), 0),
  )

  const firstName = otherName.split(' ')[0]
  const youOweTotal = Number(match.you_owe_total)
  const owedToYouTotal = Number(match.owed_to_you_total)

  const youOweRows = match.ledgers.filter((l) => l.direction === 'you_owe')
  const owedToYouRows = match.ledgers.filter((l) => l.direction === 'owed_to_you')

  const subtitle =
    owedToYouTotal > youOweTotal
      ? `${firstName} also owes you in other balances.`
      : youOweTotal > owedToYouTotal
        ? `You also owe ${firstName} in other balances.`
        : `This settles you and ${firstName} up completely.`

  const handleAdjust = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await applyAdjustment.mutateAsync({ currency: match.currency, ledgerKeys: [...selectedKeys] })
      toast.success('Balances adjusted')
      navigate({ to: ROUTES.CONTACT_BREAKDOWN, params: { id: userId }, replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none pb-12 text-left">
      <FlowHeader title="Adjust Balances" onBack={() => window.history.back()} backVariant="circle" />

      <div className="px-6 mt-3 flex flex-col gap-5">
        <div>
          <h2 className="text-[22px] font-extrabold text-[#1A1A1A] leading-tight">You can adjust this</h2>
          <p className="text-[13px] text-[#6B6B6B] font-medium mt-1">{subtitle}</p>
        </div>

        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] overflow-hidden">
          {youOweRows.length > 0 && (
            <div className="p-5 flex flex-col gap-3">
              <span className="text-[12px] font-bold text-[#C96A1B] uppercase tracking-wide">You owe {firstName}</span>
              {youOweRows.map((row) => (
                <LedgerRow row={row} selected={selectedKeys.has(ledgerKey(row))} onToggle={() => setSelectedKeys((current) => {
                  const next = new Set(current)
                  const key = ledgerKey(row)
                  next.has(key) ? next.delete(key) : next.add(key)
                  return next
                })} />
              ))}
            </div>
          )}

          {youOweRows.length > 0 && owedToYouRows.length > 0 && <hr className="border-divider border-b-[0.8px]" />}

          {owedToYouRows.length > 0 && (
            <div className="p-5 flex flex-col gap-3">
              <span className="text-[12px] font-bold text-positive uppercase tracking-wide">{firstName} owes you</span>
              {owedToYouRows.map((row) => (
                <LedgerRow row={row} selected={selectedKeys.has(ledgerKey(row))} onToggle={() => setSelectedKeys((current) => {
                  const next = new Set(current)
                  const key = ledgerKey(row)
                  next.has(key) ? next.delete(key) : next.add(key)
                  return next
                })} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#E4F2EB] border-[1.5px] border-[#0B683A26] rounded-[16px] p-4 flex items-center gap-2.5">
          <Info size={16} className="text-positive shrink-0" />
          <span className="text-[13px] font-semibold text-positive">
            We can adjust {formatCurrency(selectedAmount, match.currency)} so no money needs to be paid.
          </span>
        </div>
      </div>

      <div className="px-6 mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleAdjust}
          disabled={isSubmitting || selectedAmount <= 0}
          className="w-full h-14 rounded-full bg-positive text-white font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0 disabled:opacity-50"
        >
          {isSubmitting ? 'Adjusting...' : `Adjust ${formatCurrency(selectedAmount, match.currency)}`}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          disabled={isSubmitting}
          className="w-full h-12 rounded-full bg-transparent text-[#6B6B6B] font-bold text-base cursor-pointer hover:opacity-80 transition-all outline-none border-0 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function LedgerRow({ row, selected, onToggle }: { row: LedgerAdjustment['ledgers'][number]; selected: boolean; onToggle: () => void }) {
  const positive = row.direction === 'owed_to_you'
  return <button type="button" onClick={onToggle} className="w-full flex items-center justify-between text-left border-0 bg-transparent cursor-pointer py-1">
    <span className="flex items-center gap-2">
      <span className={`size-5 rounded-full border flex items-center justify-center shrink-0 ${selected ? 'bg-positive border-positive text-white' : 'border-[#BDBDBD]'}`}>
        {selected && <Check size={13} strokeWidth={3} />}
      </span>
      <span className="text-[14px] font-semibold text-[#1A1A1A]">{row.label}</span>
    </span>
    <span className={`text-[14px] font-bold ${positive ? 'text-positive' : 'text-[#C96A1B]'}`}>{formatCurrency(Number(row.net_amount), row.currency)}</span>
  </button>
}
