import { useState } from 'react'
import { X, Check, Scale, Info, TextAlignJustify, RefreshCw, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  FULLSCREEN_DRAWER_CN,
} from '@/components/ui/drawer'
import { useSplitExpense, type SplitData, type SplitMember } from './split-expense/use-split-expense'
import EqualSplitView from './split-expense/equal-split-view'
import UnequalSplitView from './split-expense/unequal-split-view'
import AdjustmentSplitView from './split-expense/adjustment-split-view'

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
  CategoryIcon: LucideIcon
  onClose: () => void
  onSave: (splitData: SplitData) => void
  initialSplitData?: SplitData | null
  /** Only meaningful when `members` is omitted (1:1 contact mode) — ignored
   * entirely once a real `members` list is provided. */
  contactName?: string
  contactInitials?: string
  contactAvatarColor?: string
  /** Real member list (you first, then everyone else) for a group expense —
   * when provided this replaces the 2-person contact-based list. */
  members?: SplitMember[]
  isRecurring?: boolean
  frequency?: 'Monthly' | 'Weekly'
  startsOn?: string
  /** Per-person paid amounts when paidBy === 'multiple'; used by EqualSplitView
   * to show net balance (paid minus share) for each member. */
  multiplePayerAmounts?: Record<string, number>
}

export type { SplitData }

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
  contactName = '',
  contactInitials = '',
  contactAvatarColor = '',
  members,
  isRecurring = false,
  frequency = 'Monthly',
  startsOn = '',
  multiplePayerAmounts,
}: SplitExpenseDrawerProps) {
  // Bumped whenever isOpen transitions to true, forcing SplitExpenseDrawerContent to
  // remount with fresh initial state - the idiomatic replacement for a "resync on open"
  // effect.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const [openKey, setOpenKey] = useState(0)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) setOpenKey((k) => k + 1)
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DrawerContent className={FULLSCREEN_DRAWER_CN}>
        <SplitExpenseDrawerContent
          key={openKey}
          amount={amount}
          description={description}
          categoryLabel={categoryLabel}
          categoryColor={categoryColor}
          CategoryIcon={CategoryIcon}
          onSave={onSave}
          initialSplitData={initialSplitData}
          contactName={contactName}
          contactInitials={contactInitials}
          contactAvatarColor={contactAvatarColor}
          members={members}
          isRecurring={isRecurring}
          frequency={frequency}
          startsOn={startsOn}
          multiplePayerAmounts={multiplePayerAmounts}
        />
      </DrawerContent>
    </Drawer>
  )
}

function SplitExpenseDrawerContent({
  amount,
  description,
  categoryLabel,
  categoryColor,
  CategoryIcon,
  onSave,
  initialSplitData = null,
  contactName,
  contactInitials,
  contactAvatarColor,
  members: membersProp,
  isRecurring = false,
  frequency = 'Monthly',
  startsOn = '',
  multiplePayerAmounts,
}: Omit<SplitExpenseDrawerProps, 'isOpen' | 'onClose'>) {
  const {
    members,
    splitType,
    setSplitType,
    selectedMembers,
    setSelectedMembers,
    unequalAmounts,
    adjustmentAmounts,
    totalAmount,
    numSelected,
    equalSplitAmount,
    unequalRemaining,
    getAdjustmentFinalAmount,
    handleToggleEqualMember,
    handleUnequalChange,
    handleAdjustmentChange,
    handleResetUnequal,
    handleResetAdjustment,
    handleConfirm,
  } = useSplitExpense({
    amount,
    contactName,
    contactInitials,
    contactAvatarColor,
    members: membersProp,
    initialSplitData,
    onSave,
  })

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0 relative">
        <DrawerClose asChild>
          <button
            type="button"
            className="size-8 rounded-full bg-background border border-divider text-foreground flex items-center justify-center cursor-pointer hover:bg-muted/10 outline-none focus:outline-none"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </DrawerClose>
        <h3 className="text-lg font-extrabold text-foreground absolute left-1/2 -translate-x-1/2">Split Expense</h3>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={splitType === 'unequal' && unequalRemaining !== 0}
          className={cn(
            'size-8 rounded-full flex items-center justify-center border-0 outline-none cursor-pointer transition-opacity',
            splitType === 'unequal' && unequalRemaining !== 0
              ? 'bg-[#E0E0E0] text-muted-faint cursor-not-allowed opacity-50'
              : 'bg-[#DCEFE4] text-positive hover:opacity-85'
          )}
        >
          <Check size={16} strokeWidth={3} />
        </button>
      </div>

      <hr className="border-divider border-b-[0.8px] w-full shrink-0" />

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
            <span className="font-bold text-[17px] text-foreground tracking-tight leading-tight">
              {description || 'No description added'}
            </span>
            <span className="text-[13px] text-muted-foreground font-normal mt-1 leading-none">
              {categoryLabel} · Today
            </span>
          </div>
        </div>
        {/* Amount */}
        <span className="text-xl font-bold text-foreground">
          Rs. {totalAmount.toLocaleString('en-US')}
        </span>
      </div>

      <hr className="border-divider border-b-[0.8px] w-full shrink-0" />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col px-6 pt-5 bg-white overflow-y-auto">
        {/* Split Type Selector */}
        <span className="text-[15px] font-semibold text-[#5C5C5C] text-left mb-3 block shrink-0">Split type</span>
        <div className="flex gap-2.5 w-full mb-5 shrink-0">
          {/* Equal Tab */}
          <button
            type="button"
            onClick={() => {
              setSplitType('equal')
              setSelectedMembers(members.map((m) => m.id))
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-xs font-semibold cursor-pointer transition-all outline-none border',
              splitType === 'equal'
                ? 'bg-positive text-white border-positive shadow-sm'
                : 'bg-white text-[#5C5C5C] border-divider hover:bg-gray-50/50 hover:text-foreground hover:border-gray-300'
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
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-xs font-semibold cursor-pointer transition-all outline-none border',
              splitType === 'unequal'
                ? 'bg-positive text-white border-positive shadow-sm'
                : 'bg-white text-[#5C5C5C] border-divider hover:bg-gray-50/50 hover:text-foreground hover:border-gray-300'
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
              'flex-1 flex items-center justify-center gap-2 p-3 rounded-full text-xs font-semibold cursor-pointer transition-all outline-none border',
              splitType === 'adjustment'
                ? 'bg-positive text-white border-positive shadow-sm'
                : 'bg-white text-[#5C5C5C] border-divider hover:bg-gray-50/50 hover:text-foreground hover:border-gray-300'
            )}
          >
            <TextAlignJustify className="size-4" />
            Adjustment
          </button>
        </div>

        {/* Banner Info Box */}
        <div className="w-full bg-[#E8F5EE] rounded-[14px] p-4.5 flex gap-4 text-left mb-6 items-center shrink-0">
          <div className="size-11 rounded-full bg-positive flex items-center justify-center shrink-0">
            <Info size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-bold text-sm text-foreground leading-tight">
              {splitType === 'equal' && 'Amounts adjusted Equally'}
              {splitType === 'unequal' && 'Split by Exact Amounts'}
              {splitType === 'adjustment' && 'Amounts adjusted automatically'}
            </span>
            <span className="text-xs text-muted-foreground mt-1 font-normal leading-tight">
              {splitType === 'equal' && 'Equally splitted across each member.'}
              {splitType === 'unequal' && 'Specify exactly how much each person owes.'}
              {splitType === 'adjustment' && 'Enter adjustments to reflect who owes extra.'}
            </span>
          </div>
        </div>

        {/* Mode specific views */}
        {splitType === 'equal' && (
          <EqualSplitView
            members={members}
            selectedMembers={selectedMembers}
            equalSplitAmount={equalSplitAmount}
            numSelected={numSelected}
            onToggleMember={handleToggleEqualMember}
            onSelectAllToggle={() => {
              const allSelected = selectedMembers.length === members.length
              setSelectedMembers(allSelected ? ['you'] : members.map((m) => m.id))
            }}
            multiplePayerAmounts={multiplePayerAmounts}
          />
        )}

        {splitType === 'unequal' && (
          <UnequalSplitView
            members={members}
            unequalAmounts={unequalAmounts}
            unequalRemaining={unequalRemaining}
            totalAmount={totalAmount}
            onUnequalChange={handleUnequalChange}
            onReset={handleResetUnequal}
          />
        )}

        {splitType === 'adjustment' && (
          <AdjustmentSplitView
            members={members}
            adjustmentAmounts={adjustmentAmounts}
            totalAmount={totalAmount}
            getAdjustmentFinalAmount={getAdjustmentFinalAmount}
            onAdjustmentChange={handleAdjustmentChange}
            onReset={handleResetAdjustment}
          />
        )}

        {/* Repeats Status Message (Full-width bar below list) */}
        {isRecurring && (
          <div className="flex items-center gap-2 px-6 py-3.5 bg-[#F4FAF7] text-positive text-[13.5px] font-bold border-b border-divider -mx-6 mb-2 select-none">
            <RefreshCw size={14} className="text-positive" strokeWidth={2.5} />
            <span>
              Repeats {frequency.toLowerCase()} · Starting {startsOn}
            </span>
          </div>
        )}
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
            className="w-full h-14 rounded-full bg-positive text-white font-extrabold text-base cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none border-0"
          >
            Confirm
          </button>
        )}
      </div>
    </>
  )
}
