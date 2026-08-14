import { lazy, Suspense, useState } from 'react'
import { FileText, ChevronRight, ChevronDown, Users, Check } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAuthStore } from '@/store/use-auth-store'
import { useFormattedAmountInput } from '@/hooks/use-formatted-amount-input'
import { Button } from '@/components/ui/button'
import FlowHeader from '@/components/shared/flow-header'
import CategoryPicker, { CATEGORIES } from '@/components/shared/category-picker'
import AttachmentTabs from '@/features/personal/components/attachment-tabs'
import SuccessCheck from '@/components/shared/success-check'
import type { PaidByMember } from '@/components/shared/paid-by-drawer'
import type { SplitData } from '@/components/shared/split-expense-drawer'
import { useDrawerBackHandler } from '@/hooks/use-drawer-back-handler'

// All five are closed on every mount (isOpen only flips true once the user
// taps to open one) — lazy-loading keeps their combined weight (receipt/note
// flows, the two drawers, the 77KB date picker) out of the chunk every
// expense-creation screen has to load just to show the form itself.
const AddReceiptFlow = lazy(() => import('@/components/shared/add-receipt-flow'))
const AddNoteFlow = lazy(() => import('@/components/shared/add-note-flow'))
const PaidByDrawer = lazy(() => import('@/components/shared/paid-by-drawer'))
const SplitExpenseDrawer = lazy(() => import('@/components/shared/split-expense-drawer'))
const SelectDateDrawer = lazy(() => import('@/components/shared/select-date-drawer'))

export interface ConfirmExpenseData {
  amount: number
  description: string
  category: string
  dateValue: string
  /** Real YYYY-MM-DD for the selected date — dateValue is only a display label */
  dateISO: string
  receiptFile: { name: string; size: string; dataUrl?: string } | null
  /** True only if the user actually opened the receipt picker and saved/removed
   * something this session — lets the caller tell "untouched, leave as-is"
   * apart from "explicitly cleared" when editing an expense that already had
   * a receipt (see edit-contact-expense-screen.tsx's removeReceipt logic). */
  receiptTouched: boolean
  noteText: string
  paidBy?: string
  /** Populated only when paidBy === 'multiple' — id -> amount contributed */
  multiplePayerAmounts?: Record<string, number>
  splitData?: SplitData
  expenseMode?: 'split' | 'owes_me'
}

export interface InitialExpenseData {
  amount?: string
  description?: string
  category?: string
  dateValue?: string
  dateISO?: string
  noteText?: string
  receiptFile?: { name: string; size: string; dataUrl?: string } | null
  paidBy?: string
  /** Seeds the paid-by drawer's per-person inputs when paidBy === 'multiple' —
   * without this the drawer would default to a guessed equal split instead
   * of the expense's real original amounts. */
  multiplePayerAmounts?: Record<string, number>
  splitData?: SplitData
  expenseMode?: 'split' | 'owes_me'
}

interface AddExpenseBaseProps {
  title: string
  showPaidByAndSplit: boolean
  contact?: {
    id: string
    name: string
    initials: string
    avatarColor: string
  }
  /** Real member list (you first, then everyone else) for a group expense —
   * when provided this replaces `contact`'s 2-person shape. */
  members?: PaidByMember[]
  initialData?: InitialExpenseData
  // Async-aware — the success screen only shows once this resolves; a
  // rejection keeps the form open so the caller's own error UI stays
  // visible instead of showing "success" for a submission that failed.
  onConfirm: (data: ConfirmExpenseData) => void | Promise<void>
  onSuccessComplete: () => void
  onBack: () => void
}

export default function AddExpenseBase({
  title,
  showPaidByAndSplit,
  contact,
  members,
  initialData,
  onConfirm,
  onSuccessComplete,
  onBack,
}: AddExpenseBaseProps) {
  // State management
  const { amount, handleAmountChange, formattedAmount } = useFormattedAmountInput(initialData?.amount || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || '')
  const [dateValue, setDateValue] = useState(initialData?.dateValue || 'Today')
  const [dateISO, setDateISO] = useState(() => {
    if (initialData?.dateISO) return initialData.dateISO
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  const [receiptFile, setReceiptFile] = useState<{ name: string; size: string; dataUrl?: string } | null>(
    initialData?.receiptFile ?? null,
  )
  const [receiptTouched, setReceiptTouched] = useState(false)
  const [showReceiptOverlay, setShowReceiptOverlay] = useState(false)
  const [noteText, setNoteText] = useState(initialData?.noteText || '')
  const [showNoteOverlay, setShowNoteOverlay] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [showDateDrawer, setShowDateDrawer] = useState(false)

  // Shared Expense Specific State
  const [expenseMode, setExpenseMode] = useState<'split' | 'owes_me'>(initialData?.expenseMode || 'split')
  const defaultPayerId = members?.[0]?.id ?? 'you'
  const [paidBy, setPaidBy] = useState<string>(initialData?.paidBy || defaultPayerId)
  const [multiplePayerAmounts, setMultiplePayerAmounts] = useState<Record<string, number> | undefined>(
    initialData?.multiplePayerAmounts,
  )
  const [showPaidBy, setShowPaidBy] = useState(false)
  const [splitData, setSplitData] = useState<SplitData>(initialData?.splitData || {
    type: 'equal',
    selectedMembers: members ? members.map((m) => m.id) : ['you', 'contact'],
    unequalAmounts: { you: 0, contact: 0 },
    adjustmentAmounts: { you: 0, contact: 0 },
  })
  const [showSplit, setShowSplit] = useState(false)

  const userProfile = useAuthStore((state) => state.userProfile)
  const youInitials = getInitials(userProfile?.name || 'You')

  const allMembers: PaidByMember[] = members ?? [
    { id: 'you', name: 'You', initials: youInitials, avatarColor: 'bg-positive' },
    { id: 'contact', name: contact?.name ?? '', initials: contact?.initials ?? '', avatarColor: contact?.avatarColor || 'bg-[#2F80ED]' },
  ]

  const activePayerMembers = multiplePayerAmounts
    ? allMembers.filter((m) => (multiplePayerAmounts[m.id] ?? 0) > 0)
    : allMembers

  const displayPayerMembers = activePayerMembers.length > 0 ? activePayerMembers : allMembers
  const multiplePayerCount = displayPayerMembers.length

  // Drawer primitives manage their own back-history entry globally. These
  // full-screen non-drawer overlays still need an explicit sentinel.
  const closePaidBy = () => setShowPaidBy(false)
  const closeSplit = () => setShowSplit(false)
  const closeDateDrawer = () => setShowDateDrawer(false)
  const closeReceiptOverlay = useDrawerBackHandler(showReceiptOverlay, () => setShowReceiptOverlay(false))
  const closeNoteOverlay = useDrawerBackHandler(showNoteOverlay, () => setShowNoteOverlay(false))

  const payerName = paidBy === 'multiple'
    ? 'Multiple people'
    : members
      ? (members.find((m) => m.id === paidBy)?.name ?? 'Someone')
      : paidBy === 'you'
        ? 'You'
        : (contact?.name || 'Contact')

  // Toggle helpers
  const handleToggleDate = () => {
    setShowDateDrawer(true)
  }

  const handleToggleReceipt = () => {
    setShowReceiptOverlay(true)
  }

  const handleToggleNote = () => {
    setShowNoteOverlay(true)
  }

  // Submit entry handler — awaits onConfirm so the success screen only
  // shows once a real (possibly async) submission actually succeeds; a
  // rejection leaves the form open with whatever error UI the caller
  // renders, instead of showing "success" for a failed submission.
  const [isSubmitting, setIsSubmitting] = useState(false)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = Number(amount) || 0
    if (parsedAmount <= 0 || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onConfirm({
        amount: parsedAmount,
        description: description || 'Unnamed Expense',
        category: selectedCategory,
        dateValue,
        dateISO,
        receiptFile,
        receiptTouched,
        noteText,
        paidBy: showPaidByAndSplit ? paidBy : undefined,
        multiplePayerAmounts: showPaidByAndSplit && paidBy === 'multiple' ? multiplePayerAmounts : undefined,
        splitData: showPaidByAndSplit ? splitData : undefined,
        expenseMode: showPaidByAndSplit && contact && !members ? expenseMode : undefined,
      })
      setShowSuccess(true)
    } catch {
      // Caller's onConfirm is responsible for surfacing its own error UI.
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col flex-1 bg-background min-h-screen select-none justify-between">
        <SuccessCheck onComplete={onSuccessComplete} />
      </div>
    )
  }

  const isFormInvalid = !amount || Number(amount) <= 0 || !description.trim() || !selectedCategory

  return (
    <form
      onSubmit={handleFormSubmit}
      className="app-fullscreen z-60 flex min-h-0 flex-col justify-between overflow-hidden bg-background select-none"
    >
      {/* Header */}
      <FlowHeader
        title={isAddingCategory ? 'Add Category' : title}
        onBack={onBack}
        backVariant="circle"
        rightSlot={
          showPaidByAndSplit ? (
            <button
              type="submit"
              disabled={isFormInvalid || isSubmitting}
              className="text-positive font-extrabold text-base bg-transparent border-0 cursor-pointer p-2 outline-none transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check size={22} strokeWidth={2.5} />
            </button>
          ) : undefined
        }
      />

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Inputs Content */}
        <div className="px-6 flex flex-col mt-4">
          {/* Amount Section */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground tracking-wider mb-2">
              AMOUNT
            </span>
            <div className="flex rounded-[18px] border-[0.8px] border-divider overflow-hidden bg-white shadow-[0px_2px_10px_0px_#0000000D] h-18 items-stretch">
              <div className="flex items-center justify-center bg-[#FFF9E6] px-5 border-r border-divider select-none shrink-0">
                <span className="text-base font-extrabold text-secondary leading-none">
                  Rs.
                </span>
              </div>
              <div className="flex-1 flex items-center px-4">
                <input
                  type="text"
                  inputMode="decimal"
                  value={formattedAmount}
                  onChange={handleAmountChange}
                  className="w-full bg-transparent border-0 outline-none text-[32px] font-extrabold text-foreground placeholder:text-divider font-sans leading-none py-1"
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="flex flex-col mt-6">
            <span className="text-sm font-medium text-muted-foreground tracking-wider mb-2">
              {showPaidByAndSplit ? 'What was this for?' : 'WHAT IS THIS FOR?'}
            </span>
            <div className="flex items-center gap-3 rounded-[18px] border-[0.8px] border-positive/45 bg-white shadow-[0px_2px_10px_0px_#0000000D] h-14 px-4">
              <FileText size={18} className="text-positive shrink-0" strokeWidth={1.5} />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-[15px] font-bold text-foreground placeholder:text-muted-faint py-1"
                placeholder={showPaidByAndSplit ? 'What was this for?' : 'Dinner at Monal'}
                required
              />
            </div>
          </div>

          {/* Mode Switcher Tabs (Only for 1:1 Contact Mode) */}
          {showPaidByAndSplit && contact && !members && (
            <div className="flex bg-[#F2ECE1]/60 rounded-full p-1 mt-6 border border-divider/40 select-none">
              <button
                type="button"
                onClick={() => setExpenseMode('split')}
                className={cn(
                  "flex-1 py-2.5 rounded-full text-sm font-extrabold transition-all cursor-pointer outline-none border-0",
                  expenseMode === 'split'
                    ? "bg-positive text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground bg-transparent"
                )}
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => setExpenseMode('owes_me')}
                className={cn(
                  "flex-1 py-2.5 rounded-full text-sm font-extrabold transition-all cursor-pointer outline-none border-0",
                  expenseMode === 'owes_me'
                    ? "bg-positive text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground bg-transparent"
                )}
              >
                Owes me
              </button>
            </div>
          )}

          {/* Paid by & Split row (Only in Shared Split Mode) */}
          {showPaidByAndSplit && (contact || members) && (expenseMode === 'split' || members) && (
            <div className="flex gap-4 mt-6">
              {/* Paid by */}
              <button
                type="button"
                onClick={() => setShowPaidBy(true)}
                className={cn(
                  "flex-1 rounded-[20px] border p-4 flex items-center justify-between cursor-pointer transition-all outline-none",
                  paidBy === 'multiple'
                    ? "bg-positive-soft-bg/35 border-positive/30 hover:bg-positive-soft-bg/50"
                    : "bg-white border-divider hover:bg-hover-bg"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Avatars */}
                  {paidBy === 'multiple' ? (
                    <div className="flex -space-x-2 shrink-0">
                      {displayPayerMembers.slice(0, 3).map((m) => (
                        <div key={m.id} className={cn("size-6 rounded-full border border-white text-white flex items-center justify-center font-extrabold text-[8px] select-none shadow-sm", m.avatarColor)}>
                          {m.initials}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={cn(
                      "size-6 rounded-full text-white flex items-center justify-center font-extrabold text-[9px] select-none shadow-sm",
                      members
                        ? (members.find((m) => m.id === paidBy)?.avatarColor ?? 'bg-positive')
                        : (paidBy === 'you' ? "bg-positive" : (contact?.avatarColor || 'bg-[#2F80ED]'))
                    )}>
                      {members
                        ? (members.find((m) => m.id === paidBy)?.initials ?? youInitials)
                        : (paidBy === 'you' ? youInitials : contact?.initials)}
                    </div>
                  )}

                  <div className="flex flex-col text-left">
                    <span className="text-[11px] text-muted-foreground font-semibold leading-none">Paid by</span>
                    <span className={cn(
                      "text-[14px] font-black mt-1.5 leading-none",
                      paidBy === 'multiple' ? "text-positive" : "text-foreground"
                    )}>
                      {paidBy === 'multiple' ? `${multiplePayerCount} ${multiplePayerCount === 1 ? 'person' : 'people'}` : payerName}
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} className={paidBy === 'multiple' ? "text-positive" : "text-muted-faint"} />
              </button>

              {/* Split Type */}
              <button
                type="button"
                onClick={() => setShowSplit(true)}
                className="flex-1 bg-white rounded-[20px] border border-divider p-4 flex items-center justify-between cursor-pointer hover:bg-hover-bg transition-colors outline-none"
              >
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-muted-foreground" strokeWidth={1.5} />
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] text-muted-foreground font-semibold leading-none">Split Type</span>
                    <span className="text-[14px] font-black text-foreground mt-1.5 leading-none">
                      {splitData.type === 'equal' ? 'Equal' : splitData.type === 'unequal' ? 'Unequal' : 'Adjustment'}
                    </span>
                  </div>
                </div>
                <ChevronDown size={14} className="text-muted-faint" />
              </button>
            </div>
          )}

          {/* Category Section */}
          <div className="flex flex-col mt-6">
            <span className="text-sm font-medium text-muted-foreground tracking-wider mb-3">
              CATEGORY
            </span>
            <CategoryPicker
              selectedCategoryId={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onAddCategoryOpenChange={setIsAddingCategory}
            />
          </div>
        </div>

        <div className="flex flex-col shrink-0 bg-background border-t border-divider/20 py-3">
          <AttachmentTabs
            dateValue={dateValue}
            receiptAttached={!!receiptFile}
            noteAttached={!!noteText}
            onToggleDate={handleToggleDate}
            onToggleReceipt={handleToggleReceipt}
            onToggleNote={handleToggleNote}
          />
        </div>

        <div className="px-6">

          <Button
            type="submit"
            disabled={isFormInvalid || isSubmitting}
            className="w-full h-14 rounded-full bg-primary text-white font-bold text-base cursor-pointer transition-transform active:scale-[0.99] disabled:opacity-50 disabled:bg-[#D0CBC0]"
          >
            {isSubmitting ? 'Saving...' : 'Confirm'}
          </Button>
        </div>
      </div>

      <Suspense fallback={null}>
        {/* Add Receipt Screen Flow Overlay */}
        <AddReceiptFlow
          isOpen={showReceiptOverlay}
          amount={Number(amount) || 0}
          description={description}
          category={selectedCategory}
          onClose={closeReceiptOverlay}
          onSave={(file) => {
            setReceiptFile(file)
            setReceiptTouched(true)
            closeReceiptOverlay()
          }}
          initialFile={receiptFile}
        />

        {/* Add Note Screen Flow Overlay */}
        <AddNoteFlow
          isOpen={showNoteOverlay}
          amount={Number(amount) || 0}
          description={description}
          category={selectedCategory}
          initialNote={noteText}
          onClose={closeNoteOverlay}
          onSave={(text) => {
            setNoteText(text)
            closeNoteOverlay()
          }}
        />

        {/* Paid By Selection Drawer */}
        {showPaidByAndSplit && (contact || members) && (
          <PaidByDrawer
            isOpen={showPaidBy}
            onClose={closePaidBy}
            selectedValue={paidBy}
            onSelect={(value, payerAmounts) => {
              setPaidBy(value)
              setMultiplePayerAmounts(payerAmounts)
            }}
            contactName={contact?.name}
            contactInitials={contact?.initials}
            contactAvatarColor={contact?.avatarColor}
            members={members}
            amount={Number(amount) || 0}
            initialPayerAmounts={multiplePayerAmounts}
          />
        )}

        {/* Split Expense Drawer */}
        {showPaidByAndSplit && (contact || members) && (
          <SplitExpenseDrawer
            isOpen={showSplit}
            amount={Number(amount) || 0}
            description={description}
            categoryLabel={CATEGORIES.find((cat) => cat.id === selectedCategory)?.label || 'Other'}
            categoryColor={CATEGORIES.find((cat) => cat.id === selectedCategory)?.color || '#7F8C8D'}
            CategoryIcon={CATEGORIES.find((cat) => cat.id === selectedCategory)?.icon || CATEGORIES[7].icon}
            onClose={closeSplit}
            onSave={(data) => {
              setSplitData(data)
              closeSplit()
            }}
            initialSplitData={splitData}
            contactName={contact?.name}
            contactInitials={contact?.initials}
            contactAvatarColor={contact?.avatarColor}
            members={members?.map((m) => ({ ...m, isOrganizer: m.id === defaultPayerId }))}
            multiplePayerAmounts={paidBy === 'multiple' ? multiplePayerAmounts : undefined}
          />
        )}

        {/* Select Date Drawer */}
        <SelectDateDrawer
          isOpen={showDateDrawer}
          onClose={closeDateDrawer}
          selectedValue={dateValue.toLowerCase()}
          onSelect={(val) => {
            if (val === 'today') {
              setDateValue('Today')
            } else if (val === 'yesterday') {
              setDateValue('Yesterday')
            } else {
              setDateValue(val)
            }
          }}
          onSelectISODate={setDateISO}
        />
      </Suspense>
    </form>
  )
}
