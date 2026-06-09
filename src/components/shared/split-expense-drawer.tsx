import { useState, useEffect } from 'react'
import { X, Check, Scale, AlertTriangle, Info, Users, TextAlignJustify } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from '@/components/ui/drawer'
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'

const DivideCircleIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <circle cx="12" cy="8" r="1.2" fill="currentColor" stroke="currentColor" strokeWidth="1" />
    <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="currentColor" strokeWidth="1" />
  </svg>
)

interface SplitExpenseDrawerProps {
  isOpen: boolean
  amount: number
  description: string
  categoryLabel: string
  categoryColor: string
  CategoryIcon: any
  onClose: () => void
  onSave: (splitData: SplitData) => void
  initialSplitData?: SplitData | null
  contactName: string
  contactInitials: string
  contactAvatarColor: string
}

export interface SplitData {
  type: 'equal' | 'unequal' | 'adjustment'
  selectedMembers: string[] // e.g. ['you', 'contact']
  unequalAmounts: Record<string, number>
  adjustmentAmounts: Record<string, number>
}

export default function SplitExpenseDrawer({
  isOpen,
  amount,
  description,
  categoryLabel,
  categoryColor,
  CategoryIcon,
  onClose,
  onSave,
  initialSplitData = null,
  contactName,
  contactInitials,
  contactAvatarColor,
}: SplitExpenseDrawerProps) {
  const [splitType, setSplitType] = useState<'equal' | 'unequal' | 'adjustment'>('equal')

  // Equal Split State: Selected member IDs
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['you', 'contact'])

  // Unequal Split State: Member amounts
  const [unequalAmounts, setUnequalAmounts] = useState<Record<string, string>>({
    you: '0',
    contact: '0',
  })

  // Adjustment Split State: Extra adjustment amounts
  const [adjustmentAmounts, setAdjustmentAmounts] = useState<Record<string, string>>({
    you: '0',
    contact: '0',
  })

  // Sync state with initial data or defaults when drawer opens
  useEffect(() => {
    if (isOpen) {
      if (initialSplitData) {
        setSplitType(initialSplitData.type)
        setSelectedMembers(initialSplitData.selectedMembers)
        setUnequalAmounts({
          you: String(initialSplitData.unequalAmounts.you ?? 0),
          contact: String(initialSplitData.unequalAmounts.contact ?? 0),
        })
        setAdjustmentAmounts({
          you: String(initialSplitData.adjustmentAmounts.you ?? 0),
          contact: String(initialSplitData.adjustmentAmounts.contact ?? 0),
        })
      } else {
        // Defaults: Equal split split equally
        setSplitType('equal')
        setSelectedMembers(['you', 'contact'])
        setUnequalAmounts({
          you: String(amount / 2),
          contact: String(amount / 2),
        })
        setAdjustmentAmounts({
          you: '0',
          contact: '0',
        })
      }
    }
  }, [isOpen, initialSplitData, amount])

  // --- Computations ---
  const totalAmount = amount || 0

  // 1. Equal Split calculation
  const numSelected = selectedMembers.length
  const equalSplitAmount = numSelected > 0 ? Math.round(totalAmount / numSelected) : 0

  // 2. Unequal Split validation
  const uYou = Number(unequalAmounts.you) || 0
  const uContact = Number(unequalAmounts.contact) || 0
  const unequalSum = uYou + uContact
  const unequalRemaining = totalAmount - unequalSum

  // 3. Adjustment Split calculation
  const adjYou = Number(adjustmentAmounts.you) || 0
  const adjContact = Number(adjustmentAmounts.contact) || 0
  const totalAdjustments = adjYou + adjContact
  // Base split amount after removing individual adjustments
  const baseSplitAmount = Math.max(0, totalAmount - totalAdjustments)
  const basePerPerson = Math.round(baseSplitAmount / 2)
  const finalYouAmount = basePerPerson + adjYou
  const finalContactAmount = basePerPerson + adjContact

  // --- Handlers ---
  const handleToggleEqualMember = (memberId: string) => {
    setSelectedMembers((prev) => {
      if (prev.includes(memberId)) {
        // Don't allow unselecting all
        if (prev.length === 1) return prev
        return prev.filter((m) => m !== memberId)
      } else {
        return [...prev, memberId]
      }
    })
  }

  const handleUnequalChange = (memberId: string, val: string) => {
    const rawVal = val.replace(/\D/g, '')
    setUnequalAmounts((prev) => ({
      ...prev,
      [memberId]: rawVal,
    }))
  }

  const handleAdjustmentChange = (memberId: string, val: string) => {
    const rawVal = val.replace(/\D/g, '')
    setAdjustmentAmounts((prev) => ({
      ...prev,
      [memberId]: rawVal,
    }))
  }

  const handleResetUnequal = () => {
    setUnequalAmounts({
      you: '0',
      contact: '0',
    })
  }

  const handleResetAdjustment = () => {
    setAdjustmentAmounts({
      you: '0',
      contact: '0',
    })
  }

  const handleConfirm = () => {
    // Block confirmation in Unequal mode if sums do not match
    if (splitType === 'unequal' && unequalRemaining !== 0) return

    onSave({
      type: splitType,
      selectedMembers: splitType === 'equal' ? selectedMembers : ['you', 'contact'],
      unequalAmounts: {
        you: splitType === 'unequal' ? uYou : splitType === 'equal' && selectedMembers.includes('you') ? equalSplitAmount : 0,
        contact: splitType === 'unequal' ? uContact : splitType === 'equal' && selectedMembers.includes('contact') ? equalSplitAmount : 0,
      },
      adjustmentAmounts: {
        you: splitType === 'adjustment' ? adjYou : 0,
        contact: splitType === 'adjustment' ? adjContact : 0,
      },
    })
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DrawerContent className="bg-white rounded-t-[32px] border-t-0 p-0 flex flex-col h-[90vh] max-h-[90vh] focus:outline-none overflow-hidden text-[#1A1A1A]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0 relative">
          <DrawerClose asChild>
            <button
              type="button"
              className="size-8 rounded-full bg-[#FEFAF1] border border-[#EBEBEB] text-foreground flex items-center justify-center cursor-pointer hover:bg-muted/10 outline-none focus:outline-none"
            >
              <X size={16} className="text-[#6B6B6B]" />
            </button>
          </DrawerClose>
          <h3 className="text-lg font-extrabold text-[#1A1A1A] absolute left-1/2 -translate-x-1/2">Split Expense</h3>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={splitType === 'unequal' && unequalRemaining !== 0}
            className={cn(
              'size-8 rounded-full flex items-center justify-center border-0 outline-none cursor-pointer transition-opacity',
              splitType === 'unequal' && unequalRemaining !== 0
                ? 'bg-[#E0E0E0] text-[#9A9590] cursor-not-allowed opacity-50'
                : 'bg-[#DCEFE4] text-[#0B683A] hover:opacity-85'
            )}
          >
            <Check size={16} strokeWidth={3} />
          </button>
        </div>

        <hr className="border-[#EBEBEB] border-b-[0.8px] w-full shrink-0" />

        {/* Transaction Summary Row */}
        <div className="w-full px-6 py-4.5 flex items-center justify-between bg-white select-none shrink-0">
          <div className="flex items-center gap-3.5">
            {/* Category Icon */}
            <div
              style={{ backgroundColor: `${categoryColor}1A` }}
              className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0"
            >
              <CategoryIcon size={22} style={{ color: categoryColor }} strokeWidth={1.5} />
            </div>
            {/* Labels */}
            <div className="flex flex-col text-left">
              <span className="font-bold text-[17px] text-[#1A1A1A] tracking-tight leading-tight">
                {description || 'No description added'}
              </span>
              <span className="text-[13px] text-[#6B6B6B] font-normal mt-1 leading-none">
                {categoryLabel} · Today
              </span>
            </div>
          </div>
          {/* Amount */}
          <span className="text-xl font-bold text-[#1A1A1A]">
            Rs. {totalAmount.toLocaleString('en-US')}
          </span>
        </div>

        <hr className="border-[#EBEBEB] border-b-[0.8px] w-full shrink-0" />

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col bg-white">

          {/* Split Type Selector */}
          <span className="text-[15px] font-semibold text-[#5C5C5C] text-left mb-3 block shrink-0">Split type</span>
          <div className="flex gap-2.5 w-full mb-5 shrink-0">
            {/* Equal Tab */}
            <button
              type="button"
              onClick={() => setSplitType('equal')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold cursor-pointer transition-all outline-none border',
                splitType === 'equal'
                  ? 'bg-[#0B683A] text-white border-[#0B683A] shadow-sm'
                  : 'bg-white text-[#5C5C5C] border-[#EBEBEB] hover:bg-gray-50/50 hover:text-[#1A1A1A] hover:border-gray-300'
              )}
            >
              <Scale size={16} strokeWidth={2.5} />
              Equal
            </button>

            {/* Unequal Tab */}
            <button
              type="button"
              onClick={() => setSplitType('unequal')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold cursor-pointer transition-all outline-none border',
                splitType === 'unequal'
                  ? 'bg-[#0B683A] text-white border-[#0B683A] shadow-sm'
                  : 'bg-white text-[#5C5C5C] border-[#EBEBEB] hover:bg-gray-50/50 hover:text-[#1A1A1A] hover:border-gray-300'
              )}
            >
              <DivideCircleIcon className="size-4" />
              Unequal
            </button>

            {/* Adjustment Tab */}
            <button
              type="button"
              onClick={() => setSplitType('adjustment')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold cursor-pointer transition-all outline-none border',
                splitType === 'adjustment'
                  ? 'bg-[#0B683A] text-white border-[#0B683A] shadow-sm'
                  : 'bg-white text-[#5C5C5C] border-[#EBEBEB] hover:bg-gray-50/50 hover:text-[#1A1A1A] hover:border-gray-300'
              )}
            >
              <TextAlignJustify className="size-4" />
              Adjustment
            </button>
          </div>

          {/* Banner Info Box */}
          <div className="w-full bg-[#E8F5EE] rounded-[14px] p-[18px] flex gap-4 text-left mb-6 items-center shrink-0">
            <div className="size-11 rounded-full bg-[#0B683A] flex items-center justify-center shrink-0">
              <Info size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-bold text-sm text-[#1A1A1A] leading-tight">
                {splitType === 'equal' && 'Amounts adjusted Equally'}
                {splitType === 'unequal' && 'Split by Exact Amounts'}
                {splitType === 'adjustment' && 'Amounts adjusted automatically'}
              </span>
              <span className="text-xs text-[#6B6B6B] mt-1 font-normal leading-tight">
                {splitType === 'equal' && 'Equally splitted across each member.'}
                {splitType === 'unequal' && 'Specify exactly how much each person owes.'}
                {splitType === 'adjustment' && 'Enter adjustments to reflect who owes extra.'}
              </span>
            </div>
          </div>

          {/* Equal split summary row */}
          {splitType === 'equal' && (
            <div className="flex items-center gap-2 mb-4 shrink-0 select-none text-left">
              <div className="w-6 h-6 rounded-full bg-[#0B683A] flex items-center justify-center text-white shrink-0">
                <Users size={12} className="text-white" />
              </div>
              <span className="text-[13px] font-bold text-[#1A1A1A]">
                {numSelected} people <span className="text-[#6B6B6B] font-semibold">· Rs. {equalSplitAmount.toLocaleString('en-US')} each</span>
              </span>
            </div>
          )}

          {/* Unequal split warning row */}
          {splitType === 'unequal' && (
            <div className="flex items-center justify-between text-xs font-bold text-[#C0392B] px-1 mb-4 select-none shrink-0">
              <span className="flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-[#C0392B] fill-[#C0392B]/10" />
                Rs. {Math.abs(unequalRemaining).toLocaleString('en-US')} {unequalRemaining > 0 ? 'remaining' : 'over split'}
              </span>
              <span className="text-[#9A9590]">Total: Rs. {totalAmount.toLocaleString('en-US')}</span>
            </div>
          )}

          {/* Adjustment split overview row */}
          {splitType === 'adjustment' && (
            <div className="flex items-center justify-between mb-4 shrink-0 select-none text-left">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#0B683A] flex items-center justify-center text-white shrink-0">
                  <Users size={12} className="text-white" />
                </div>
                <span className="text-[13px] font-bold text-[#1A1A1A]">
                  2 people
                </span>
              </div>
              <span className="text-xs text-[#9A9590] font-semibold">Total: Rs. {totalAmount.toLocaleString('en-US')}</span>
            </div>
          )}

          {/* Members Heading Row */}
          <div className="flex items-center justify-between mb-2 shrink-0 select-none">
            <span className="text-xs font-bold text-[#6B6B6B]">
              {splitType === 'equal' && 'Members'}
              {splitType === 'unequal' && 'Set amount per person'}
              {splitType === 'adjustment' && 'Members'}
            </span>
            {splitType === 'equal' && (
              <button
                type="button"
                onClick={() => {
                  const allSelected = selectedMembers.length === 2
                  setSelectedMembers(allSelected ? ['you'] : ['you', 'contact'])
                }}
                className="text-xs font-bold text-[#0B683A] bg-transparent border-0 cursor-pointer flex items-center gap-1.5 outline-none hover:opacity-85"
              >
                Select all
                <Check size={14} className="border border-[#0B683A] rounded p-0.5 size-4" />
              </button>
            )}
            {splitType === 'unequal' && (
              <button
                type="button"
                onClick={handleResetUnequal}
                className="flex items-center gap-1 text-[#0B683A] font-bold text-xs bg-transparent border-0 cursor-pointer outline-none hover:opacity-85"
              >
                Reset
              </button>
            )}
            {splitType === 'adjustment' && (
              <button
                type="button"
                onClick={handleResetAdjustment}
                className="flex items-center gap-1 text-[#C0392B] font-bold text-xs bg-transparent border-0 cursor-pointer outline-none hover:opacity-85"
              >
                Reset
              </button>
            )}
          </div>

          {/* List box container */}
          <div className="bg-[#FDF8F4] rounded-[24px] border-[0.8px] border-[#EBEBEB] overflow-hidden shadow-[0px_4px_16px_rgba(0,0,0,0.02)] divide-y divide-[#EBEBEB] flex flex-col mb-4">
            {/* Member: You */}
            <div className={cn("p-4 flex items-center justify-between transition-colors", (splitType === 'equal' && selectedMembers.includes('you')) ? 'bg-[#FFF9E6]' : 'bg-transparent')}>
              <div className="flex items-center gap-3 text-left">
                {splitType === 'equal' && (
                  <button
                    type="button"
                    onClick={() => handleToggleEqualMember('you')}
                    className="size-5 rounded border-0 p-0 flex items-center justify-center shrink-0 cursor-pointer outline-none"
                  >
                    {selectedMembers.includes('you') ? (
                      <div className="size-5 rounded bg-[#0B683A] flex items-center justify-center text-white">
                        <Check size={12} strokeWidth={4} className="text-white" />
                      </div>
                    ) : (
                      <div className="size-5 rounded border-[1.5px] border-[#D4CFC8] bg-transparent" />
                    )}
                  </button>
                )}
                <div className="relative">
                  <Avatar className="size-10 shrink-0 font-extrabold text-sm text-white select-none">
                    <AvatarFallback className="rounded-full flex items-center justify-center border-0 text-white font-extrabold text-sm bg-[#0B683A]">
                      MH
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#14A558] border border-white rounded-full" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-[#1A1A1A]">You</span>
                  <span className="text-[10px] text-[#0B683A] font-bold bg-[#E5F2EB] px-1.5 py-0.5 rounded-full mt-0.5 self-start leading-none">
                    Organizer
                  </span>
                </div>
              </div>

              {/* Right side controls */}
              {splitType === 'equal' && (
                <span className={cn('font-semibold text-sm text-[#1A1A1A]', !selectedMembers.includes('you') && 'opacity-30')}>
                  Rs. {selectedMembers.includes('you') ? equalSplitAmount.toLocaleString('en-US') : '0'}
                </span>
              )}
              {splitType === 'unequal' && (
                <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-[12px] border-[0.8px] border-[#EBEBEB] shadow-[0px_1px_4px_rgba(0,0,0,0.02)]">
                  <span className="text-xs text-[#9A9590] font-bold">Rs.</span>
                  <input
                    type="text"
                    value={unequalAmounts.you}
                    onChange={(e) => handleUnequalChange('you', e.target.value)}
                    className="w-18 bg-transparent border-0 outline-none text-sm font-extrabold text-[#1A1A1A] text-right font-sans py-0"
                  />
                </div>
              )}
              {splitType === 'adjustment' && (
                <div className="flex items-center gap-6">
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-[#9A9590] font-semibold">Final Amount</span>
                    <span className="text-sm font-extrabold text-[#0B683A] mt-0.5">
                      Rs. {finalYouAmount.toLocaleString('en-US')}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#9A9590] font-semibold mb-1 text-left">owes extra</span>
                    <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-[12px] border-[0.8px] border-[#EBEBEB] shadow-[0px_1px_4px_rgba(0,0,0,0.02)]">
                      <span className="text-xs text-[#9A9590] font-bold">Rs.</span>
                      <input
                        type="text"
                        value={adjustmentAmounts.you}
                        onChange={(e) => handleAdjustmentChange('you', e.target.value)}
                        className="w-14 bg-transparent border-0 outline-none text-xs font-extrabold text-[#1A1A1A] text-right font-sans py-0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Member: Contact */}
            <div className={cn("p-4 flex items-center justify-between transition-colors", (splitType === 'equal' && selectedMembers.includes('contact')) ? 'bg-[#FFF9E6]' : 'bg-transparent')}>
              <div className="flex items-center gap-3 text-left">
                {splitType === 'equal' && (
                  <button
                    type="button"
                    onClick={() => handleToggleEqualMember('contact')}
                    className="size-5 rounded border-0 p-0 flex items-center justify-center shrink-0 cursor-pointer outline-none"
                  >
                    {selectedMembers.includes('contact') ? (
                      <div className="size-5 rounded bg-[#0B683A] flex items-center justify-center text-white">
                        <Check size={12} strokeWidth={4} className="text-white" />
                      </div>
                    ) : (
                      <div className="size-5 rounded border-[1.5px] border-[#D4CFC8] bg-transparent" />
                    )}
                  </button>
                )}
                <div className="relative">
                  <Avatar className="size-10 shrink-0 font-extrabold text-sm text-white select-none">
                    <AvatarFallback className={cn("rounded-full flex items-center justify-center border-0 text-white font-extrabold text-sm", contactAvatarColor)}>
                      {contactInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#14A558] border border-white rounded-full" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-[#1A1A1A]">{contactName}</span>
                </div>
              </div>

              {/* Right side controls */}
              {splitType === 'equal' && (
                <span className={cn('font-semibold text-sm text-[#1A1A1A]', !selectedMembers.includes('contact') && 'opacity-30')}>
                  Rs. {selectedMembers.includes('contact') ? equalSplitAmount.toLocaleString('en-US') : '0'}
                </span>
              )}
              {splitType === 'unequal' && (
                <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-[12px] border-[0.8px] border-[#EBEBEB] shadow-[0px_1px_4px_rgba(0,0,0,0.02)]">
                  <span className="text-xs text-[#9A9590] font-bold">Rs.</span>
                  <input
                    type="text"
                    value={unequalAmounts.contact}
                    onChange={(e) => handleUnequalChange('contact', e.target.value)}
                    className="w-18 bg-transparent border-0 outline-none text-sm font-extrabold text-[#1A1A1A] text-right font-sans py-0"
                  />
                </div>
              )}
              {splitType === 'adjustment' && (
                <div className="flex items-center gap-6">
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-[#9A9590] font-semibold">Final Amount</span>
                    <span className="text-sm font-extrabold text-[#0B683A] mt-0.5">
                      Rs. {finalContactAmount.toLocaleString('en-US')}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#9A9590] font-semibold mb-1 text-left">owes extra</span>
                    <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-[12px] border-[0.8px] border-[#EBEBEB] shadow-[0px_1px_4px_rgba(0,0,0,0.02)]">
                      <span className="text-xs text-[#9A9590] font-bold">Rs.</span>
                      <input
                        type="text"
                        value={adjustmentAmounts.contact}
                        onChange={(e) => handleAdjustmentChange('contact', e.target.value)}
                        className="w-14 bg-transparent border-0 outline-none text-xs font-extrabold text-[#1A1A1A] text-right font-sans py-0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pinned Bottom CTA Bar */}
        <div className="px-6 py-5 bg-white shrink-0">
          {splitType === 'unequal' && unequalRemaining !== 0 ? (
            <button
              type="button"
              disabled
              className="w-full h-14 rounded-full bg-[#D2CFC7] text-white font-bold text-base cursor-not-allowed flex items-center justify-center outline-none border-0 select-none shadow-none"
            >
              Rs. {Math.abs(unequalRemaining).toLocaleString('en-US')} remaining
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full h-14 rounded-full bg-[#0B683A] text-white font-extrabold text-base cursor-pointer shadow-[0px_4px_16px_0px_#F3C62373] hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
            >
              Confirm
            </button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
