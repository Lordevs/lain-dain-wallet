import { useState } from 'react'
import { FileText, ChevronRight, ChevronDown, Users, Check } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAuthStore } from '@/store/use-auth-store'
import { useFormattedAmountInput } from '@/hooks/use-formatted-amount-input'
import { Button } from '@/components/ui/button'
import FlowHeader from '@/components/shared/flow-header'
import CategoryPicker, { CATEGORIES } from '@/features/personal/components/category-picker'
import AttachmentTabs from '@/features/personal/components/attachment-tabs'
import AddReceiptFlow from '@/components/shared/add-receipt-flow'
import AddNoteFlow from '@/components/shared/add-note-flow'
import SuccessCheck from '@/components/shared/success-check'
import PaidByDrawer from '@/components/shared/paid-by-drawer'
import SplitExpenseDrawer, { type SplitData } from '@/components/shared/split-expense-drawer'
import SelectDateDrawer from '@/components/shared/select-date-drawer'

export interface ConfirmExpenseData {
  amount: number
  description: string
  category: string
  dateValue: string
  receiptFile: { name: string; size: string; dataUrl?: string } | null
  noteText: string
  paidBy?: string
  splitData?: SplitData
}

export interface InitialExpenseData {
  amount?: string
  description?: string
  category?: string
  dateValue?: string
  paidBy?: string
  splitData?: SplitData
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
  initialData?: InitialExpenseData
  onConfirm: (data: ConfirmExpenseData) => void
  onSuccessComplete: () => void
  onBack: () => void
}

export default function AddExpenseBase({
  title,
  showPaidByAndSplit,
  contact,
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
  const [receiptFile, setReceiptFile] = useState<{ name: string; size: string; dataUrl?: string } | null>(null)
  const [showReceiptOverlay, setShowReceiptOverlay] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [showNoteOverlay, setShowNoteOverlay] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showDateDrawer, setShowDateDrawer] = useState(false)

  // Shared Expense Specific State
  const [paidBy, setPaidBy] = useState<string>(initialData?.paidBy || 'you')
  const [showPaidBy, setShowPaidBy] = useState(false)
  const [splitData, setSplitData] = useState<SplitData>(initialData?.splitData || {
    type: 'equal',
    selectedMembers: ['you', 'contact'],
    unequalAmounts: { you: 0, contact: 0 },
    adjustmentAmounts: { you: 0, contact: 0 },
  })
  const [showSplit, setShowSplit] = useState(false)

  const userProfile = useAuthStore((state) => state.userProfile)
  const youInitials = getInitials(userProfile?.name || 'You')

  const payerName = paidBy === 'you'
    ? 'You'
    : paidBy === 'multiple'
      ? 'Multiple people'
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

  // Submit entry handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = Number(amount) || 0
    if (parsedAmount <= 0) return

    onConfirm({
      amount: parsedAmount,
      description: description || 'Unnamed Expense',
      category: selectedCategory,
      dateValue,
      receiptFile,
      noteText,
      paidBy: showPaidByAndSplit ? paidBy : undefined,
      splitData: showPaidByAndSplit ? splitData : undefined,
    })

    setShowSuccess(true)
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
      className="fixed inset-0 z-60 flex flex-col bg-background select-none justify-between overflow-hidden"
    >
      {/* Header */}
      <FlowHeader
        title={title}
        onBack={onBack}
        backVariant="circle"
        rightSlot={
          showPaidByAndSplit ? (
            <button
              type="submit"
              disabled={isFormInvalid}
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

          {/* Paid by & Split row (Only in Shared Mode) */}
          {showPaidByAndSplit && contact && (
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
                      <div className="size-6 rounded-full border border-white bg-positive text-white flex items-center justify-center font-extrabold text-[8px] select-none shadow-sm">
                        {youInitials}
                      </div>
                      <div className="size-6 rounded-full border border-white bg-[#2F80ED] text-white flex items-center justify-center font-extrabold text-[8px] select-none shadow-sm">
                        AH
                      </div>
                      <div className="size-6 rounded-full border border-white bg-orange-payable text-white flex items-center justify-center font-extrabold text-[8px] select-none shadow-sm">
                        SK
                      </div>
                    </div>
                  ) : (
                    <div className={cn(
                      "size-6 rounded-full text-white flex items-center justify-center font-extrabold text-[9px] select-none shadow-sm",
                      paidBy === 'you' ? "bg-positive" : (contact.avatarColor || 'bg-[#2F80ED]')
                    )}>
                      {paidBy === 'you' ? youInitials : contact.initials}
                    </div>
                  )}

                  <div className="flex flex-col text-left">
                    <span className="text-[11px] text-muted-foreground font-semibold leading-none">Paid by</span>
                    <span className={cn(
                      "text-[14px] font-black mt-1.5 leading-none",
                      paidBy === 'multiple' ? "text-positive" : "text-foreground"
                    )}>
                      {paidBy === 'multiple' ? '3 people' : payerName}
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
            disabled={isFormInvalid}
            className="w-full h-14 rounded-full bg-primary text-white font-bold text-base cursor-pointer transition-transform active:scale-[0.99] disabled:opacity-50 disabled:bg-[#D0CBC0]"
          >
            Confirm
          </Button>
        </div>
      </div>

      {/* Add Receipt Screen Flow Overlay */}
      <AddReceiptFlow
        isOpen={showReceiptOverlay}
        amount={Number(amount) || 0}
        description={description}
        category={selectedCategory}
        onClose={() => setShowReceiptOverlay(false)}
        onSave={(file) => {
          setReceiptFile(file)
          setShowReceiptOverlay(false)
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
        onClose={() => setShowNoteOverlay(false)}
        onSave={(text) => {
          setNoteText(text)
          setShowNoteOverlay(false)
        }}
      />

      {/* Paid By Selection Drawer */}
      {showPaidByAndSplit && contact && (
        <PaidByDrawer
          isOpen={showPaidBy}
          onClose={() => setShowPaidBy(false)}
          selectedValue={paidBy}
          onSelect={setPaidBy}
          contactName={contact.name}
          contactInitials={contact.initials}
          contactAvatarColor={contact.avatarColor}
          amount={Number(amount) || 0}
        />
      )}

      {/* Split Expense Drawer */}
      {showPaidByAndSplit && contact && (
        <SplitExpenseDrawer
          isOpen={showSplit}
          amount={Number(amount) || 0}
          description={description}
          categoryLabel={CATEGORIES.find((cat) => cat.id === selectedCategory)?.label || 'Other'}
          categoryColor={CATEGORIES.find((cat) => cat.id === selectedCategory)?.color || '#7F8C8D'}
          CategoryIcon={CATEGORIES.find((cat) => cat.id === selectedCategory)?.icon || CATEGORIES[7].icon}
          onClose={() => setShowSplit(false)}
          onSave={(data) => {
            setSplitData(data)
            setShowSplit(false)
          }}
          initialSplitData={splitData}
          contactName={contact.name}
          contactInitials={contact.initials}
          contactAvatarColor={contact.avatarColor}
        />
      )}

      {/* Select Date Drawer */}
      <SelectDateDrawer
        isOpen={showDateDrawer}
        onClose={() => setShowDateDrawer(false)}
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
      />
    </form>
  )
}
