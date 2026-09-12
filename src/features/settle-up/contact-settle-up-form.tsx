import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Check, ChevronDown, Banknote, CreditCard, Smile, Shield, Upload, Calendar, Camera, Pencil, Lock } from 'lucide-react'
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
import { useContactLedgers } from '@/features/contacts/hooks/use-contact-ledgers'
import { useCreateFriendshipSettlementMutation } from './api/use-create-friendship-settlement-mutation'
import { initialsForName, colorForName } from '@/lib/avatar-visuals'
import { formatCurrency, getCurrency } from '@/lib/currency'
import { ROUTES } from '@/constants/routes'
import type { components } from '@/lib/api/schema'

type UserSummary = components['schemas']['UserSummary']
type UserLedgerItem = components['schemas']['UserLedgerItem']

const METHOD_LABEL: Record<PaymentMethodType, string> = {
  cash: 'Cash', bank: 'Bank Transfer', easypaisa: 'Easypaisa', jazzcash: 'JazzCash', other: 'Other',
}
const METHOD_ICON: Record<PaymentMethodType, typeof Banknote> = {
  cash: Banknote, bank: CreditCard, easypaisa: Smile, jazzcash: Shield, other: Upload,
}

/** Real 1:1 settle-up — reached via ROUTES.SETTLE_UP?contactId={userId}. */
export default function ContactSettleUpForm({ userId }: { userId: string }) {
  const ledgers = useContactLedgers(userId)

  if (ledgers.isLoading) {
    return <ExpenseFormSkeleton />
  }

  if (ledgers.isError || !ledgers.data || !ledgers.friendshipId) {
    return (
      <div className="flex items-center justify-center p-6 bg-[#FEFAF1] h-[50vh]">
        <div className="text-center">
          <p className="text-lg font-bold text-[#1A1A1A]">Couldn't load this contact</p>
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

  const friendshipBalance = ledgers.data.ledgers.find((l) => l.scope === 'friendship')

  // Mounted only once the friendship + balance are loaded, so its own
  // useState lazy initializers pick up the real values on first render.
  return (
    <ContactSettleUpFormBody
      userId={userId}
      friendshipId={ledgers.friendshipId}
      otherUser={ledgers.data.other_user}
      balance={friendshipBalance}
    />
  )
}

function ContactSettleUpFormBody({
  userId,
  friendshipId,
  otherUser,
  balance,
}: {
  userId: string
  friendshipId: string
  otherUser: UserSummary
  balance: UserLedgerItem | undefined
}) {
  const navigate = useNavigate()
  const createSettlement = useCreateFriendshipSettlementMutation(friendshipId)

  const outstanding = balance ? Math.abs(Math.round(Number(balance.net_amount) * 100) / 100) : 0
  const currency = balance?.currency ?? 'PKR'
  const currencySymbol = getCurrency(currency).symbol

  const [mode, setMode] = useState<'pay' | 'receive'>(balance?.direction === 'owed_to_you' ? 'receive' : 'pay')
  // Settlement amounts must be intentional user input. Keep the field empty
  // on first open instead of silently pre-filling the full outstanding balance.
  const [amount, setAmount] = useState('')
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

  const parsedAmount = Number(amount) || 0
  const isValid = parsedAmount > 0
  const handleAmountChange = (value: string) => {
    const withoutSeparators = value.replace(/,/g, '').replace(/[^\d.]/g, '')
    const [whole = '', ...decimalParts] = withoutSeparators.split('.')
    const hasDecimalPoint = withoutSeparators.includes('.')
    const decimal = decimalParts.join('').slice(0, 2)
    const limitedWhole = whole.slice(0, 7)
    const normalized = hasDecimalPoint ? `${limitedWhole || '0'}.${decimal}` : limitedWhole
    setAmount(normalized && Number(normalized) > outstanding ? outstanding.toFixed(2) : normalized)
  }

  const handleConfirm = async () => {
    if (!isValid || isSubmitting) return
    setIsSubmitting(true)
    try {
      await createSettlement.mutateAsync({
        mode,
        amount: parsedAmount.toFixed(2),
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
    navigate({ to: ROUTES.CONTACT_DETAILS, params: { id: userId }, replace: true })
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

  const initials = initialsForName(otherUser.full_name)
  const avatarColor = colorForName(otherUser.full_name)
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

      {/* Contact Card */}
      <div className="px-6 mt-4">
        <div className="bg-white rounded-[24px] border-[0.8px] border-[#EBEBEB] p-4 flex items-center gap-3.5 shadow-[0px_4px_16px_rgba(0,0,0,0.02)] text-left">
          <ContactAvatar initials={initials} avatarColor={avatarColor} src={otherUser.image ?? undefined} size="md" />
          <div className="flex flex-col">
            <span className="font-extrabold text-[15px] text-[#1A1A1A] leading-tight">{otherUser.full_name}</span>
            <span className="text-[12px] text-[#6B6B6B] font-semibold mt-0.5">
              {outstanding === 0
                ? 'Settled up'
                : balance?.direction === 'owed_to_you'
                  ? `Owes you ${formatCurrency(outstanding, currency)}`
                  : `You owe ${formatCurrency(outstanding, currency)}`}
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

      {/* Amount Input */}
      <div className="px-6 mt-6">
        <span className="text-sm font-medium text-muted-foreground tracking-wider mb-2 block">AMOUNT</span>
        <div className="flex rounded-[18px] border-[0.8px] border-divider overflow-hidden bg-white shadow-[0px_2px_10px_0px_#0000000D] h-18 items-stretch">
          <div className="flex items-center justify-center bg-[#FFF9E6] px-5 border-r border-divider select-none shrink-0">
            <span className="text-base font-extrabold text-secondary leading-none">{currencySymbol}</span>
          </div>
          <div className="flex-1 flex items-center px-4">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full bg-transparent border-0 outline-none text-[32px] font-extrabold text-foreground placeholder:text-divider font-sans leading-none py-1"
              placeholder="0"
            />
          </div>
        </div>
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
        amount={parsedAmount}
        description={`Settle up with ${otherUser.full_name}`}
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
        amount={parsedAmount}
        description={`Settle up with ${otherUser.full_name}`}
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
