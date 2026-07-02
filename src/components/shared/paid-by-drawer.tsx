import { useState, useEffect, useMemo } from 'react'
import { Check, X, Info, Users, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
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

interface PaidByDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (value: string) => void
  selectedValue: string
  contactName: string
  contactInitials: string
  contactAvatarColor: string
  amount?: number
}

export default function PaidByDrawer({
  isOpen,
  onClose,
  onSelect,
  selectedValue,
  contactName,
  contactInitials,
  contactAvatarColor,
  amount = 5000,
}: PaidByDrawerProps) {
  const [view, setView] = useState<'selection' | 'multiple'>('selection')
  const [tempValue, setTempValue] = useState<string>(selectedValue)

  // Amount inputs for multiple payers
  const [payerAmounts, setPayerAmounts] = useState<Record<string, string>>({})

  // Resolve members list dynamically based on group or single contact
  const isGroup = useMemo(() => {
    return contactName.toLowerCase().includes('trip') || contactName.toLowerCase().includes('family') || contactName.toLowerCase().includes('group')
  }, [contactName])

  const members = useMemo(() => {
    return isGroup
      ? [
        { id: 'you', name: 'You', subname: 'Muhammad Huzaifa', initials: 'MH', avatarColor: 'bg-[#0B683A]' },
        { id: 'ali', name: 'Ali Hassan', subname: 'Ali Hassan', initials: 'AH', avatarColor: 'bg-[#2F80ED]' },
        { id: 'sara', name: 'Sara Khan', subname: 'Sara Khan', initials: 'SK', avatarColor: 'bg-[#C96A1B]' },
        { id: 'hassan', name: 'Hassan', subname: 'Hassan', initials: 'HS', avatarColor: 'bg-[#475569]' },
      ]
      : [
        { id: 'you', name: 'You', subname: 'Muhammad Huzaifa', initials: 'MH', avatarColor: 'bg-[#0B683A]' },
        { id: 'contact', name: contactName, subname: contactName, initials: contactInitials, avatarColor: contactAvatarColor || 'bg-[#2F80ED]' },
      ]
  }, [isGroup, contactName, contactInitials, contactAvatarColor])

  useEffect(() => {
    if (isOpen) {
      setView(selectedValue === 'multiple' ? 'multiple' : 'selection')
      setTempValue(selectedValue)

      const initialAmounts: Record<string, string> = {}
      members.forEach((m) => {
        if (selectedValue === 'multiple') {
          const share = Math.round(amount / members.length)
          initialAmounts[m.id] = share.toString()
        } else {
          initialAmounts[m.id] = m.id === selectedValue ? amount.toString() : ''
        }
      })
      setPayerAmounts(initialAmounts)
    }
  }, [isOpen, selectedValue, members, amount])

  // Calculated multi-payer assignments
  const totalAmount = amount || 5000
  const totalAssigned = members.reduce((sum, member) => sum + (Number(payerAmounts[member.id]) || 0), 0)
  const totalUnassigned = Math.max(0, totalAmount - totalAssigned)

  const handleAmountChange = (memberId: string, val: string) => {
    const rawVal = val.replace(/\D/g, '')
    setPayerAmounts((prev) => ({
      ...prev,
      [memberId]: rawVal
    }))
  }

  const handleAutofill = () => {
    const remaining = totalAmount - totalAssigned
    if (remaining <= 0) return
    setPayerAmounts((prev) => ({
      ...prev,
      you: ((Number(prev.you) || 0) + remaining).toString()
    }))
  }

  const getFormattedMemberAmount = (id: string) => {
    const val = payerAmounts[id]
    if (!val) return ''
    return Number(val).toLocaleString('en-US')
  }

  const handleConfirmAction = () => {
    if (view === 'multiple') {
      onSelect('multiple')
    } else {
      onSelect(tempValue)
    }
    onClose()
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DrawerContent className={FULLSCREEN_DRAWER_CN}>

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0 relative">
          {view === 'multiple' ? (
            <button
              type="button"
              onClick={() => setView('selection')}
              className="size-8 rounded-full bg-[#FEFAF1] border border-[#EBEBEB] text-foreground flex items-center justify-center cursor-pointer hover:bg-muted/10 outline-none focus:outline-none"
            >
              <ChevronLeft size={16} className="text-[#6B6B6B]" />
            </button>
          ) : (
            <DrawerClose asChild>
              <button
                type="button"
                className="size-8 rounded-full bg-[#FEFAF1] border border-[#EBEBEB] text-foreground flex items-center justify-center cursor-pointer hover:bg-muted/10 outline-none focus:outline-none"
              >
                <X size={16} className="text-[#6B6B6B]" />
              </button>
            </DrawerClose>
          )}
          <h3 className="text-lg font-extrabold text-[#1A1A1A] absolute left-1/2 -translate-x-1/2">
            Paid by
          </h3>
          <div className="size-8" />
        </div>

        <hr className="border-[#EBEBEB] border-b-[0.8px] w-full shrink-0" />

        {/* View 1: Selector List */}
        {view === 'selection' && (
          <>
            <div className="text-[13px] font-semibold text-[#9A9590] px-6 pt-4 text-left shrink-0">
              Who paid for this expense?
            </div>

            <div className="flex-1 px-6 my-4 overflow-y-auto">
              <div className="bg-[#FEFAF1] rounded-[24px] border-[0.8px] border-[#EBEBEB] overflow-hidden shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EBEBEB] text-left">
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
                          <span className="font-semibold text-sm text-[#1A1A1A] leading-tight">
                            {member.name} {member.id === 'you' && '(default)'}
                          </span>
                          <span className="text-[11px] text-[#6B6B6B] font-medium mt-1 leading-none">
                            Paid the full amount
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#0B683A] flex items-center justify-center text-white shrink-0">
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
                      <span className="font-semibold text-sm text-[#1A1A1A] leading-tight">
                        Multiple people
                      </span>
                      <span className="text-[11px] text-[#6B6B6B] font-medium mt-1 leading-none">
                        More than one person paid
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#9A9590]" />
                </button>
              </div>
            </div>

            {/* Bottom Tip Info Box */}
            <div className="mx-6 mb-2 p-4 rounded-[20px] bg-[#E4F2EB]/50 border border-[#0B683A1F] flex gap-3 text-left shrink-0">
              <Info size={16} className="text-[#0B683A] shrink-0 mt-0.5" />
              <span className="text-[12px] font-semibold text-[#0B683A] leading-normal">
                Use <strong className="font-extrabold">Multiple people</strong> when more than one person contributed to pay the bill.
              </span>
            </div>
          </>
        )}

        {/* View 2: Multiple Payers Details Grid */}
        {view === 'multiple' && (
          <>
            <div className="flex flex-col px-6 pt-4 text-left shrink-0">
              <span className="text-[13px] font-semibold text-[#6B6B6B]">
                How much did each person pay?
              </span>
              <div className="flex items-center justify-between mt-3 mb-2">
                <span className={cn("text-[13px] font-bold", totalUnassigned === 0 ? "text-[#0B683A]" : "text-[#C96A1B]")}>
                  {totalUnassigned === 0
                    ? `Rs. ${totalAmount.toLocaleString('en-US')} assigned`
                    : `Rs. ${totalAssigned.toLocaleString('en-US')} assigned`
                  }
                </span>
                <span className="text-[13px] font-semibold text-[#9A9590]">
                  of Rs. {totalAmount.toLocaleString('en-US')}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#EBEBEB] text-left">
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
                        <span className="font-semibold text-sm text-[#1A1A1A] leading-tight">
                          {member.name}
                        </span>
                        {member.subname && member.subname !== member.name && (
                          <span className="text-[11px] text-[#9A9590] font-medium mt-1 leading-none">
                            {member.subname}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Input Box */}
                    <div className={cn(
                      "w-28 h-12 rounded-[14px] border-[1.5px] flex items-center px-4 transition-all focus-within:border-[#0B683A59] focus-within:bg-[#F5FBF7]",
                      hasValue
                        ? "border-[#0B683A]/30 bg-white"
                        : "border-[#EFE7DD] bg-[#F7F5F0]"
                    )}>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Rs. 0"
                        value={getFormattedMemberAmount(member.id)}
                        onChange={(e) => handleAmountChange(member.id, e.target.value)}
                        className="w-full text-right outline-none bg-transparent font-extrabold text-sm text-[#1A1A1A] placeholder:text-[#9A9590]/50"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Pinned Bottom Confirm Action Button */}
        <div className="flex flex-col shrink-0 bg-white border-t border-[#EFE7DD]/40">
          {view === 'multiple' && totalUnassigned > 0 && (
            <div className="mx-6 py-3 flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#C96A1B] flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-[#C96A1B]" />
                Rs. {totalUnassigned.toLocaleString('en-US')} still unassigned
              </span>
              <button
                type="button"
                onClick={handleAutofill}
                className="text-[13px] font-extrabold text-[#0B683A] bg-transparent border-0 cursor-pointer p-1 hover:underline outline-none"
              >
                Auto-fill
              </button>
            </div>
          )}

          <div className="px-6 py-5">
            <button
              type="button"
              onClick={handleConfirmAction}
              disabled={view === 'multiple' && totalUnassigned !== 0}
              className="w-full h-14 rounded-[20px] bg-[#0B683A] text-white font-extrabold text-base cursor-pointer shadow-[0px_4px_16px_rgba(11,104,58,0.15)] hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center outline-none border-0"
            >
              Confirm
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
