import { useState, useMemo } from 'react'
import { Check, X, Info, Users, ChevronLeft, ChevronRight, AlertTriangle, LockKeyhole } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAuthStore } from '@/store/use-auth-store'
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  FULLSCREEN_DRAWER_CN,
} from '@/components/ui/drawer'
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'

export interface PaidByMember {
  id: string
  name: string
  initials: string
  avatarColor: string
}

interface PaidByDrawerProps {
  isOpen: boolean
  onClose: () => void
  /** `payerAmounts` (id -> amount) is only populated when `value === 'multiple'` —
   * the actual per-person contribution, needed to build a real multi-payer
   * expense; lost otherwise since a single payer's amount is just the total. */
  onSelect: (value: string, payerAmounts?: Record<string, number>) => void
  selectedValue: string
  /** Only meaningful when `members` is omitted (1:1 contact mode) — ignored
   * entirely once a real `members` list is provided. */
  contactName?: string
  contactInitials?: string
  contactAvatarColor?: string
  /** Real member list (you first, then everyone else) for a group expense —
   * when provided this replaces the 2-person contact-based list below. */
  members?: PaidByMember[]
  amount?: number
  /** Seeds the per-person inputs from the expense's real original amounts
   * when editing — without this, reopening this view guesses an equal
   * split instead. */
  initialPayerAmounts?: Record<string, number>
}

export default function PaidByDrawer({
  isOpen,
  onClose,
  onSelect,
  selectedValue,
  contactName = '',
  contactInitials = '',
  contactAvatarColor = '',
  members,
  amount = 0,
  initialPayerAmounts,
}: PaidByDrawerProps) {
  // Bumped whenever isOpen transitions to true, forcing PaidByDrawerContent to remount
  // with fresh initial state - the idiomatic replacement for a "resync on open" effect.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const [openKey, setOpenKey] = useState(0)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) setOpenKey((k) => k + 1)
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DrawerContent className={FULLSCREEN_DRAWER_CN}>
        <PaidByDrawerContent
          key={openKey}
          onClose={onClose}
          onSelect={onSelect}
          selectedValue={selectedValue}
          contactName={contactName}
          contactInitials={contactInitials}
          contactAvatarColor={contactAvatarColor}
          members={members}
          amount={amount}
          initialPayerAmounts={initialPayerAmounts}
        />
      </DrawerContent>
    </Drawer>
  )
}

function PaidByDrawerContent({
  onClose,
  onSelect,
  selectedValue,
  contactName,
  contactInitials,
  contactAvatarColor,
  members: membersProp,
  amount,
  initialPayerAmounts,
}: Omit<PaidByDrawerProps, 'isOpen' | 'amount'> & { amount: number }) {
  const [view, setView] = useState<'selection' | 'multiple'>(selectedValue === 'multiple' ? 'multiple' : 'selection')
  const [tempValue, setTempValue] = useState<string>(selectedValue)

  const userProfile = useAuthStore((state) => state.userProfile)
  const youName = userProfile?.name || 'You'
  const youInitials = getInitials(youName)

  const members = useMemo(() => {
    if (membersProp) {
      return membersProp.map((m) => ({ id: m.id, name: m.name, subname: m.name, initials: m.initials, avatarColor: m.avatarColor }))
    }
    return [
      { id: 'you', name: 'You', subname: youName, initials: youInitials, avatarColor: 'bg-positive' },
      { id: 'contact', name: contactName, subname: contactName, initials: contactInitials, avatarColor: contactAvatarColor || 'bg-[#2F80ED]' },
    ]
  }, [membersProp, contactName, contactInitials, contactAvatarColor, youName, youInitials])

  const defaultId = members[0]?.id ?? 'you'

  // New multiple-payer selections start blank so the user explicitly assigns
  // each contribution. Existing edit forms still restore saved amounts.
  const [payerAmounts, setPayerAmounts] = useState<Record<string, string>>(() => {
    const initialAmounts: Record<string, string> = {}
    members.forEach((m) => {
      if (selectedValue === 'multiple') {
        const savedAmount = initialPayerAmounts?.[m.id]
        initialAmounts[m.id] = savedAmount === undefined ? '' : savedAmount.toString()
      } else {
        initialAmounts[m.id] = m.id === selectedValue ? amount.toString() : ''
      }
    })
    return initialAmounts
  })

  // When no amount has been entered on the form yet, the inputs are locked.
  const hasAmount = amount > 0

  // Calculated multi-payer assignments
  const totalAmount = amount || 0
  const totalAssigned = members.reduce((sum, member) => sum + (Number(payerAmounts[member.id]) || 0), 0)
  const totalUnassigned = Math.max(0, totalAmount - totalAssigned)

  const handleAmountChange = (memberId: string, val: string) => {
    const rawVal = val.replace(/\D/g, '')
    const numVal = Number(rawVal) || 0

    // Calculate the sum of contributions from all other members
    const otherSum = members
      .filter((m) => m.id !== memberId)
      .reduce((sum, m) => sum + (Number(payerAmounts[m.id]) || 0), 0)

    // Max allowed for this member is the remaining unassigned amount
    const maxAllowed = Math.max(0, totalAmount - otherSum)
    const cappedVal = numVal > maxAllowed ? maxAllowed.toString() : rawVal

    setPayerAmounts((prev) => ({
      ...prev,
      [memberId]: cappedVal
    }))
  }

  const handleAutofill = () => {
    const remaining = totalAmount - totalAssigned
    if (remaining <= 0) return
    setPayerAmounts((prev) => ({
      ...prev,
      [defaultId]: ((Number(prev[defaultId]) || 0) + remaining).toString()
    }))
  }

  const getFormattedMemberAmount = (id: string) => {
    const val = payerAmounts[id]
    if (!val) return ''
    return Number(val).toLocaleString('en-US')
  }

  const handleConfirmAction = () => {
    if (view === 'multiple') {
      const amounts: Record<string, number> = {}
      members.forEach((m) => {
        amounts[m.id] = Number(payerAmounts[m.id]) || 0
      })
      onSelect('multiple', amounts)
      onClose()
    } else {
      onSelect(tempValue)
      onClose()
    }
  }

  return (
    <>
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0 relative">
        {view === 'multiple' ? (
          <button
            type="button"
            onClick={() => setView('selection')}
            className="size-8 rounded-full bg-background border border-divider text-foreground flex items-center justify-center cursor-pointer hover:bg-muted/10 outline-none focus:outline-none"
          >
            <ChevronLeft size={16} className="text-muted-foreground" />
          </button>
        ) : (
          <DrawerClose asChild>
            <button
              type="button"
              className="size-8 rounded-full bg-background border border-divider text-foreground flex items-center justify-center cursor-pointer hover:bg-muted/10 outline-none focus:outline-none"
            >
              <X size={16} className="text-muted-foreground" />
            </button>
          </DrawerClose>
        )}
        <h3 className="text-lg font-extrabold text-foreground absolute left-1/2 -translate-x-1/2">
          Paid by
        </h3>
        <div className="size-8" />
      </div>

      <hr className="border-divider border-b-[0.8px] w-full shrink-0" />

      {/* View 1: Selector List */}
      {view === 'selection' && (
        <>
          <div className="text-[13px] font-semibold text-muted-faint px-6 pt-4 text-left shrink-0">
            Who paid for this expense?
          </div>

          <div className="flex-1 px-6 my-4 overflow-y-auto">
            <div className="bg-background rounded-[24px] border-[0.8px] border-divider overflow-hidden shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-divider text-left">
              {/* Dynamic Member Buttons */}
              {members.map((member) => {
                const isSelected = tempValue === member.id
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setTempValue(member.id)}
                    className={cn(
                      'w-full flex items-center justify-between py-4.5 px-5 text-left border-0 cursor-pointer transition-colors outline-none',
                      isSelected ? 'bg-[#FFF9E6]' : 'bg-transparent'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 shrink-0 font-extrabold text-sm text-white select-none shadow-sm">
                        <AvatarFallback className={cn("rounded-full flex items-center justify-center border-0 text-white font-extrabold text-sm", member.avatarColor)}>
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-sm text-foreground leading-tight">
                          {member.name} {member.id === defaultId && '(default)'}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-medium mt-1 leading-none">
                          Paid the full amount
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-positive flex items-center justify-center text-white shrink-0">
                        <Check size={14} strokeWidth={3} className="text-white" />
                      </div>
                    )}
                  </button>
                )
              })}

              {/* Multiple People Option Button */}
              <button
                type="button"
                onClick={() => {
                  setTempValue('multiple')
                  setPayerAmounts(Object.fromEntries(members.map((member) => [member.id, ''])))
                  setView('multiple')
                }}
                className={cn(
                  'w-full flex items-center justify-between py-4.5 px-5 text-left border-0 cursor-pointer transition-colors outline-none',
                  tempValue === 'multiple' ? 'bg-[#FFF9E6]' : 'bg-transparent'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-[#7D3C98] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Users size={18} strokeWidth={2} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-sm text-foreground leading-tight">
                      Multiple people
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium mt-1 leading-none">
                      More than one person paid
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-faint" />
              </button>
            </div>
          </div>

          {/* Bottom Tip Info Box */}
          <div className="mx-6 mb-2 p-4 rounded-[20px] bg-positive-soft-bg/50 border border-positive/12 flex gap-3 text-left shrink-0">
            <Info size={16} className="text-positive shrink-0 mt-0.5" />
            <span className="text-[12px] font-semibold text-positive leading-normal">
              Use <strong className="font-extrabold">Multiple people</strong> when more than one person contributed to pay the bill.
            </span>
          </div>
        </>
      )}

      {/* View 2: Multiple Payers Details Grid */}
      {view === 'multiple' && (
        <>
          <div className="flex flex-col px-6 pt-4 text-left shrink-0">
            <span className="text-[13px] font-semibold text-muted-foreground">
              How much did each person pay?
            </span>
            {!hasAmount ? (
              <div className="flex items-center gap-2 mt-3 mb-2 px-3.5 py-2.5 rounded-[14px] bg-amber-50 border border-amber-200">
                <LockKeyhole size={14} className="text-amber-600 shrink-0" />
                <span className="text-[12px] font-semibold text-amber-700">
                  Enter an expense amount first to assign contributions.
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-3 mb-2">
                <span className={cn("text-[13px] font-bold", totalUnassigned === 0 ? "text-positive" : "text-orange-payable")}>
                  {totalUnassigned === 0
                    ? `Rs. ${totalAmount.toLocaleString('en-US')} assigned`
                    : `Rs. ${totalAssigned.toLocaleString('en-US')} assigned`
                  }
                </span>
                <span className="text-[13px] font-semibold text-muted-faint">
                  of Rs. {totalAmount.toLocaleString('en-US')}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-divider text-left">
            {members.map((member) => {
              const hasValue = Number(payerAmounts[member.id]) > 0
              return (
                <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 shrink-0 font-extrabold text-sm text-white select-none shadow-sm">
                      <AvatarFallback className={cn("rounded-full flex items-center justify-center border-0 text-white font-extrabold text-sm", member.avatarColor)}>
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-sm text-foreground leading-tight">
                        {member.name}
                      </span>
                      {member.subname && member.subname !== member.name && (
                        <span className="text-[11px] text-muted-faint font-medium mt-1 leading-none">
                          {member.subname}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Input Box */}
                  <div className={cn(
                    "w-28 h-12 rounded-[14px] border-[1.5px] flex items-center px-4 transition-all",
                    !hasAmount
                      ? "border-border-card bg-hover-bg opacity-50 cursor-not-allowed"
                      : hasValue
                        ? "border-positive/30 bg-white focus-within:border-positive/35 focus-within:bg-[#F5FBF7]"
                        : "border-border-card bg-hover-bg focus-within:border-positive/35 focus-within:bg-[#F5FBF7]"
                  )}>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Rs. 0"
                      disabled={!hasAmount}
                      value={getFormattedMemberAmount(member.id)}
                      onChange={(e) => handleAmountChange(member.id, e.target.value)}
                      className="w-full text-right outline-none bg-transparent font-extrabold text-sm text-foreground placeholder:text-muted-faint/50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Pinned Bottom Confirm Action Button */}
      <div className="flex flex-col shrink-0 bg-white border-t border-border-card/40">
        {view === 'multiple' && hasAmount && totalUnassigned > 0 && (
          <div className="mx-6 py-3 flex items-center justify-between">
            <span className="text-[13px] font-bold text-orange-payable flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-orange-payable" />
              Rs. {totalUnassigned.toLocaleString('en-US')} still unassigned
            </span>
            <button
              type="button"
              onClick={handleAutofill}
              className="text-[13px] font-extrabold text-positive bg-transparent border-0 cursor-pointer p-1 hover:underline outline-none"
            >
              Auto-fill
            </button>
          </div>
        )}

        <div className="px-6 py-5">
          <button
            type="button"
            onClick={handleConfirmAction}
            disabled={view === 'multiple' && (!hasAmount || totalUnassigned !== 0)}
            className="w-full h-14 rounded-[20px] bg-positive text-white font-extrabold text-base cursor-pointer shadow-[0px_4px_16px_rgba(11,104,58,0.15)] hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center outline-none border-0"
          >
            Confirm
          </button>
        </div>
      </div>
    </>
  )
}
