import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Check, ChevronDown, Banknote, CreditCard, Smile, Shield, Upload, Calendar, Camera, Pencil, Lock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import FlowHeader from '@/components/shared/flow-header'
import SuccessCheck from '@/components/shared/success-check'
import ContactAvatar from '@/components/shared/contact-avatar'
import ExpenseFormSkeleton from '@/components/shared/expense-form-skeleton'
import PaymentMethodDrawer, { type PaymentMethodType } from '@/components/shared/payment-method-drawer'
import SelectDateDrawer from '@/components/shared/select-date-drawer'
import AddReceiptFlow from '@/components/shared/add-receipt-flow'
import AddNoteFlow from '@/components/shared/add-note-flow'
import { useDrawerBackHandler } from '@/hooks/use-drawer-back-handler'
import { useGroupQuery } from '@/features/groups/api/use-group-query'
import { useGroupBalanceQuery } from '@/features/groups/api/use-group-balance-query'
import { useCreateGroupSettlementMutation } from './api/use-create-group-settlement-mutation'
import { initialsForName, colorForName } from '@/lib/avatar-visuals'
import { formatCurrency } from '@/lib/currency'
import { ROUTES } from '@/constants/routes'
import type { components } from '@/lib/api/schema'

type Group = components['schemas']['Group']
type PersonBalance = components['schemas']['PersonBalance']

const METHOD_LABEL: Record<PaymentMethodType, string> = {
  cash: 'Cash', bank: 'Bank Transfer', easypaisa: 'Easypaisa', jazzcash: 'JazzCash', other: 'Other',
}
const METHOD_ICON: Record<PaymentMethodType, typeof Banknote> = {
  cash: Banknote, bank: CreditCard, easypaisa: Smile, jazzcash: Shield, other: Upload,
}

function outstandingOf(balance: PersonBalance): number {
  return Math.abs(Math.round(Number(balance.net_amount) * 100) / 100)
}

function sanitizeSettlementAmount(value: string, max: number): string {
  const withoutSeparators = value.replace(/,/g, '').replace(/[^\d.]/g, '')
  const [whole = '', ...decimalParts] = withoutSeparators.split('.')
  const hasDecimalPoint = withoutSeparators.includes('.')
  const decimal = decimalParts.join('').slice(0, 2)
  const limitedWhole = whole.slice(0, 7)
  const normalized = hasDecimalPoint ? `${limitedWhole || '0'}.${decimal}` : limitedWhole
  return normalized && Number(normalized) > max ? max.toFixed(2) : normalized
}

function buildDefaultAmounts(balances: PersonBalance[]): Record<string, string> {
  const map: Record<string, string> = {}
  balances.forEach((b) => {
    // Allocations are intentional user input. Start both Pay and Receive
    // forms empty so opening the form never silently assigns a full balance.
    map[b.other_user.id] = ''
  })
  return map
}

/** Real group batch settle-up — reached via ROUTES.SETTLE_UP?groupId={id}. */
export default function GroupSettleUpForm({ groupId }: { groupId: string }) {
  const groupQuery = useGroupQuery(groupId)
  const balanceQuery = useGroupBalanceQuery(groupId)

  if (groupQuery.isLoading || balanceQuery.isLoading) {
    return <ExpenseFormSkeleton />
  }

  if (groupQuery.isError || !groupQuery.data) {
    return (
      <div className="flex items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
        <div className="text-center">
          <p className="text-lg font-bold text-[#1A1A1A]">Couldn't load this group</p>
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

  // Mounted only once the group + balances are loaded, so its own
  // useState lazy initializers pick up the real per-member amounts on
  // first render — no effect needed.
  return (
    <GroupSettleUpFormBody groupId={groupId} group={groupQuery.data} balances={balanceQuery.data ?? []} />
  )
}

function GroupSettleUpFormBody({
  groupId,
  group,
  balances,
}: {
  groupId: string
  group: Group
  balances: PersonBalance[]
}) {
  const navigate = useNavigate()
  const createSettlement = useCreateGroupSettlementMutation(groupId)

  const payBalances = useMemo(() => balances.filter((b) => b.direction === 'you_owe'), [balances])
  const receiveBalances = useMemo(() => balances.filter((b) => b.direction === 'owed_to_you'), [balances])

  const [mode, setMode] = useState<'pay' | 'receive'>(payBalances.length > 0 ? 'pay' : 'receive')
  // Both directions' default amounts are precomputed once up front — no
  // effect needed to reset amounts when the user switches tabs.
  const [amountsByMode, setAmountsByMode] = useState(() => ({
    pay: buildDefaultAmounts(payBalances),
    receive: buildDefaultAmounts(receiveBalances),
  }))

  const relevantBalances = mode === 'pay' ? payBalances : receiveBalances
  const amounts = amountsByMode[mode]
  const currency = relevantBalances[0]?.currency ?? group.default_currency

  const setMemberAmount = (memberId: string, val: string, max: number) => {
    const capped = sanitizeSettlementAmount(val, max)
    setAmountsByMode((prev) => ({ ...prev, [mode]: { ...prev[mode], [memberId]: capped } }))
  }

  const [method, setMethod] = useState<PaymentMethodType>('cash')
  const [dateVal, setDateVal] = useState('today')
  const [dateISO, setDateISO] = useState<string | undefined>(undefined)
  const [receiptFile, setReceiptFile] = useState<{ name: string; size: string; dataUrl?: string } | null>(null)
  const [noteText, setNoteText] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isMethodDrawerOpen, setIsMethodDrawerOpen] = useState(false)
  const [isDateDrawerOpen, setIsDateDrawerOpen] = useState(false)
  const [isReceiptFlowOpen, setIsReceiptFlowOpen] = useState(false)
  const [isNoteFlowOpen, setIsNoteFlowOpen] = useState(false)

  const closeMethodDrawer = () => setIsMethodDrawerOpen(false)
  const closeDateDrawer = () => setIsDateDrawerOpen(false)
  const closeReceiptFlow = useDrawerBackHandler(isReceiptFlowOpen, () => setIsReceiptFlowOpen(false))
  const closeNoteFlow = useDrawerBackHandler(isNoteFlowOpen, () => setIsNoteFlowOpen(false))

  const totalOwed = relevantBalances.reduce((sum, b) => sum + outstandingOf(b), 0)
  const totalAssigned = Math.round(relevantBalances.reduce(
    (sum, b) => sum + (Number(amounts[b.other_user.id]) || 0),
    0,
  ) * 100) / 100

  const entries = relevantBalances
    .map((b) => ({ user_id: b.other_user.id, amount: Number(amounts[b.other_user.id]) || 0 }))
    .filter((e) => e.amount > 0)

  const isValid = entries.length > 0

  const handleConfirm = async () => {
    if (!isValid || isSubmitting) return
    setIsSubmitting(true)
    try {
      await createSettlement.mutateAsync({
        mode,
        entries: entries.map((e) => ({ user_id: e.user_id, amount: e.amount.toFixed(2) })),
        method,
        date: dateISO,
        note: noteText || undefined,
        receipt: receiptFile?.dataUrl,
      })
      setShowSuccess(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuccessComplete = () => {
    navigate({ to: ROUTES.GROUP_DETAILS, params: { id: groupId }, replace: true })
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-[#FEFAF1] select-none justify-center">
        <SuccessCheck
          text={mode === 'receive' ? 'Payment Received' : ''}
          showConfetti={mode === 'receive'}
          onComplete={handleSuccessComplete}
        />
      </div>
    )
  }

  const groupInitials = initialsForName(group.name)
  const groupAvatarColor = colorForName(group.name)
  const MethodIcon = METHOD_ICON[method]

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[#FEFAF1] select-none pb-32 text-[#1A1A1A]">
      <FlowHeader
        title="Settle Up"
        onBack={() => window.history.back()}
        backVariant="circle"
        rightSlot={
          <Check
            size={24}
            onClick={handleConfirm}
            className={cn(
              'stroke-[3px] shrink-0',
              isValid && !isSubmitting ? 'text-positive cursor-pointer hover:opacity-80 active:scale-95 transition-all' : 'text-muted-faint'
            )}
          />
        }
      />

      {/* Group Card */}
      <div className="px-6 mt-4">
        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] p-4 flex items-center gap-3.5 shadow-[0px_4px_16px_rgba(0,0,0,0.02)] text-left">
          <ContactAvatar initials={groupInitials} avatarColor={groupAvatarColor} src={group.image ?? undefined} size="md" />
          <div className="flex flex-col">
            <span className="font-extrabold text-[15px] text-[#1A1A1A] leading-tight">{group.name}</span>
            <span className="text-[12px] text-[#6B6B6B] font-semibold mt-0.5">
              {group.members.length} members
            </span>
          </div>
        </div>
      </div>

      {/* Pay/Receive Tabs */}
      <div className="px-6 mt-4">
        <div className="bg-white border-[0.8px] border-[#EBEBEB] rounded-full p-1.5 flex items-center">
          <button
            type="button"
            onClick={() => setMode('pay')}
            className={cn(
              'flex-1 py-3 text-center rounded-full text-sm font-extrabold transition-all border-0 outline-none cursor-pointer',
              mode === 'pay' ? 'bg-[#C96A1B] text-white' : 'bg-transparent text-[#6B6B6B] hover:text-[#1A1A1A]'
            )}
          >
            Pay
          </button>
          <button
            type="button"
            onClick={() => setMode('receive')}
            className={cn(
              'flex-1 py-3 text-center rounded-full text-sm font-extrabold transition-all border-0 outline-none cursor-pointer',
              mode === 'receive' ? 'bg-positive text-white' : 'bg-transparent text-[#6B6B6B] hover:text-[#1A1A1A]'
            )}
          >
            Receive
          </button>
        </div>
      </div>

      {/* Assigned / Total Card */}
      {relevantBalances.length > 0 && (
        <div className="px-6 mt-4">
          <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] flex shadow-[0px_4px_16px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="flex-1 p-5 flex flex-col text-center items-center justify-center">
              <span className="text-[#6B6B6B] text-[12px] font-bold">
                {mode === 'pay' ? 'Paying now' : 'Receiving now'}
              </span>
              <span className={cn('text-[30px] font-extrabold mt-1.5 leading-none tracking-tight', mode === 'pay' ? 'text-[#C96A1B]' : 'text-positive')}>
                {formatCurrency(totalAssigned, currency)}
              </span>
            </div>
            <div className="w-[0.8px] bg-[#EBEBEB] self-stretch my-4" />
            <div className="flex-1 p-5 flex flex-col text-center items-center justify-center">
              <span className="text-[#6B6B6B] text-[12px] font-bold">Still left</span>
              <span className={cn('text-[30px] font-extrabold mt-1.5 leading-none tracking-tight', mode === 'pay' ? 'text-[#C96A1B]' : 'text-positive')}>
                {formatCurrency(Math.max(0, totalOwed - totalAssigned), currency)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Member list header */}
      <div className="px-6 mt-6 flex items-center gap-2 text-[#C96A1B]">
        <Users size={16} strokeWidth={2.5} className="text-[#C96A1B]" />
        <span className="text-sm font-extrabold text-[#1A1A1A]">
          {mode === 'pay' ? 'Who did you pay?' : 'Who paid you?'}
        </span>
      </div>

      {/* Member rows */}
      <div className="px-6 mt-4 flex flex-col gap-5 text-left">
        {relevantBalances.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {mode === 'pay' ? "You don't owe anyone in this group." : 'No one owes you in this group.'}
          </p>
        ) : (
          relevantBalances.map((b, i) => {
            const max = outstandingOf(b)
            const value = amounts[b.other_user.id] ?? ''
            const remaining = Math.max(0, Math.round((max - (Number(value) || 0)) * 100) / 100)
            const initials = initialsForName(b.other_user.full_name)
            const avatarColor = colorForName(b.other_user.full_name)

            return (
              <div key={b.other_user.id}>
                {i > 0 && <div className="h-[0.8px] bg-[#EBEBEB]/80 -mx-6 mb-5" />}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0 text-left">
                    <ContactAvatar initials={initials} avatarColor={avatarColor} src={b.other_user.image ?? undefined} size="md" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-extrabold text-base text-[#1A1A1A] leading-tight truncate">
                        {b.other_user.full_name}
                      </span>
                      <span className={cn('text-[12px] font-semibold mt-1 leading-none', mode === 'pay' ? 'text-[#C96A1B]' : 'text-positive')}>
                        {remaining === 0 ? 'Fully assigned' : `Left: ${formatCurrency(remaining, currency)}`}
                      </span>
                    </div>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => setMemberAmount(b.other_user.id, e.target.value, max)}
                    placeholder="0"
                    className={cn(
                      'border border-[#EBEBEB] rounded-[14px] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] font-bold text-center w-32 placeholder:text-[#9A9590] placeholder:font-medium focus:outline-none focus:ring-1',
                      mode === 'pay' ? 'focus:ring-[#C96A1B] focus:border-[#C96A1B]' : 'focus:ring-positive focus:border-positive'
                    )}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Bottom Option Pills Row */}
      <div className="px-6 mt-6 flex items-center justify-start gap-2.5 flex-wrap pb-2">
        <button
          type="button"
          onClick={() => setIsMethodDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border-[0.8px] border-[#E8E4DC] bg-white text-xs font-medium text-[#6B6B6B] shrink-0 outline-none cursor-pointer active:scale-95 transition-all"
        >
          <MethodIcon size={14} className="text-[#6B6B6B]" />
          <span>{METHOD_LABEL[method]}</span>
          <ChevronDown size={14} className="text-[#6B6B6B]" />
        </button>

        <button
          type="button"
          onClick={() => setIsDateDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border-[0.8px] border-[#E8E4DC] bg-white text-xs font-medium text-[#6B6B6B] shrink-0 outline-none cursor-pointer active:scale-95 transition-all"
        >
          <Calendar size={14} className="text-[#6B6B6B]" />
          <span>{dateVal === 'today' ? 'Today' : dateVal === 'yesterday' ? 'Yesterday' : dateVal}</span>
          <ChevronDown size={14} className="text-[#6B6B6B]" />
        </button>

        <button
          type="button"
          onClick={() => setIsReceiptFlowOpen(true)}
          className={cn(
            'flex items-center gap-1.5 px-3.5 py-2 rounded-full border-[0.8px] bg-white text-xs font-medium shrink-0 outline-none cursor-pointer active:scale-95 transition-all',
            receiptFile ? 'bg-[#E4F2EB] border-[#0B683A4D] text-positive' : 'border-[#E8E4DC] text-[#6B6B6B]'
          )}
        >
          <Camera size={14} className={receiptFile ? 'text-positive' : 'text-[#6B6B6B]'} />
          <span>{receiptFile ? 'Receipt Attached' : 'Receipt'}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsNoteFlowOpen(true)}
          className={cn(
            'flex items-center gap-1.5 px-3.5 py-2 rounded-full border-[0.8px] bg-white text-xs font-medium shrink-0 outline-none cursor-pointer active:scale-95 transition-all',
            noteText.trim() ? 'bg-[#E4F2EB] border-[#0B683A4D] text-positive' : 'border-[#E8E4DC] text-[#6B6B6B]'
          )}
        >
          <Pencil size={14} className={noteText.trim() ? 'text-positive' : 'text-[#6B6B6B]'} />
          <span>{noteText.trim() ? 'Note Added' : 'Note'}</span>
        </button>
      </div>

      <div className="mt-5 text-[#6B6B6B] text-xs font-normal flex items-center justify-center gap-1.5 shrink-0">
        <Lock size={12} className="text-[#6B6B6B]" />
        <span>{mode === 'pay' ? 'They will be asked to confirm.' : 'This settles immediately.'}</span>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="safe-action-fixed z-10 flex flex-col items-center justify-center gap-4">

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isValid || isSubmitting}
          className="w-full h-14 rounded-full bg-[#FDB105] text-[#1A1A1A] font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Confirm'}
        </button>
      </div>

      <PaymentMethodDrawer isOpen={isMethodDrawerOpen} onClose={closeMethodDrawer} selectedValue={method} onSelect={setMethod} />
      <SelectDateDrawer
        isOpen={isDateDrawerOpen}
        onClose={closeDateDrawer}
        selectedValue={dateVal}
        onSelect={setDateVal}
        onSelectISODate={setDateISO}
      />
      <AddReceiptFlow
        isOpen={isReceiptFlowOpen}
        amount={totalAssigned}
        description={`Settle up in ${group.name}`}
        category="other"
        initialFile={receiptFile}
        onClose={closeReceiptFlow}
        onSave={(file) => {
          setReceiptFile(file)
          closeReceiptFlow()
        }}
      />
      <AddNoteFlow
        isOpen={isNoteFlowOpen}
        amount={totalAssigned}
        description={`Settle up in ${group.name}`}
        category="other"
        initialNote={noteText}
        onClose={closeNoteFlow}
        onSave={(text) => {
          setNoteText(text)
          closeNoteFlow()
        }}
      />
    </div>
  )
}
