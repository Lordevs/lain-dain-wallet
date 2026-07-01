import { useState } from 'react'
import { FileText, ChevronRight, ChevronDown, Users, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  const [amount, setAmount] = useState(initialData?.amount || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || 'bills')
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

  const payerName = paidBy === 'you'
    ? 'You'
    : paidBy === 'multiple'
      ? 'Multiple people'
      : (contact?.name || 'Contact')
  // Format amount input as number with commas
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '')
    setAmount(rawVal)
  }

  const getFormattedAmount = () => {
    if (!amount) return ''
    return Number(amount).toLocaleString('en-US')
  }

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
      <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none justify-between">
        <SuccessCheck onComplete={onSuccessComplete} />
      </div>
    )
  }

  const isFormInvalid = !amount || Number(amount) <= 0 || !description.trim()

  return (
    <form
      onSubmit={handleFormSubmit}
      className="flex flex-col h-screen max-h-screen bg-[#FEFAF1] select-none justify-between overflow-hidden relative"
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
              className="text-[#0B683A] font-extrabold text-base bg-transparent border-0 cursor-pointer p-2 outline-none transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
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
            <span className="text-sm font-medium text-[#6B6B6B] tracking-wider mb-2">
              AMOUNT
            </span>
            <div className="flex rounded-[18px] border-[0.8px] border-[#EBEBEB] overflow-hidden bg-white shadow-[0px_2px_10px_0px_#0000000D] h-18 items-stretch">
              <div className="flex items-center justify-center bg-[#FFF9E6] px-5 border-r border-[#EBEBEB] select-none shrink-0">
                <span className="text-base font-extrabold text-secondary leading-none">
                  Rs.
                </span>
              </div>
              <div className="flex-1 flex items-center px-4">
                <input
                  type="text"
                  inputMode="decimal"
                  value={getFormattedAmount()}
                  onChange={handleAmountChange}
                  className="w-full bg-transparent border-0 outline-none text-[32px] font-extrabold text-[#1A1A1A] placeholder:text-[#EBEBEB] font-sans leading-none py-1"
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="flex flex-col mt-6">
            <span className="text-sm font-medium text-[#6B6B6B] tracking-wider mb-2">
              {showPaidByAndSplit ? 'What was this for?' : 'WHAT IS THIS FOR?'}
            </span>
            <div className="flex items-center gap-3 rounded-[18px] border-[0.8px] border-[#0B683A73] bg-white shadow-[0px_2px_10px_0px_#0000000D] h-14 px-4">
              <FileText size={18} className="text-[#0B683A] shrink-0" strokeWidth={1.5} />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-[15px] font-bold text-[#1A1A1A] placeholder:text-[#9A9590] py-1"
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
                    ? "bg-[#E4F2EB]/35 border-[#0B683A4D] hover:bg-[#E4F2EB]/50"
                    : "bg-white border-[#EBEBEB] hover:bg-[#F7F5F0]"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Avatars */}
                  {paidBy === 'multiple' ? (
                    <div className="flex -space-x-2 shrink-0">
                      <div className="size-6 rounded-full border border-white bg-[#0B683A] text-white flex items-center justify-center font-extrabold text-[8px] select-none shadow-sm">
                        MH
                      </div>
                      <div className="size-6 rounded-full border border-white bg-[#2F80ED] text-white flex items-center justify-center font-extrabold text-[8px] select-none shadow-sm">
                        AH
                      </div>
                      <div className="size-6 rounded-full border border-white bg-[#C96A1B] text-white flex items-center justify-center font-extrabold text-[8px] select-none shadow-sm">
                        SK
                      </div>
                    </div>
                  ) : (
                    <div className={cn(
                      "size-6 rounded-full text-white flex items-center justify-center font-extrabold text-[9px] select-none shadow-sm",
                      paidBy === 'you' ? "bg-[#0B683A]" : (contact.avatarColor || 'bg-[#2F80ED]')
                    )}>
                      {paidBy === 'you' ? 'MH' : contact.initials}
                    </div>
                  )}

                  <div className="flex flex-col text-left">
                    <span className="text-[11px] text-[#6B6B6B] font-semibold leading-none">Paid by</span>
                    <span className={cn(
                      "text-[14px] font-black mt-1.5 leading-none",
                      paidBy === 'multiple' ? "text-[#0B683A]" : "text-[#1A1A1A]"
                    )}>
                      {paidBy === 'multiple' ? '3 people' : payerName}
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} className={paidBy === 'multiple' ? "text-[#0B683A]" : "text-[#9A9590]"} />
              </button>

              {/* Split Type */}
              <button
                type="button"
                onClick={() => setShowSplit(true)}
                className="flex-1 bg-white rounded-[20px] border border-[#EBEBEB] p-4 flex items-center justify-between cursor-pointer hover:bg-[#F7F5F0] transition-colors outline-none"
              >
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-[#6B6B6B]" strokeWidth={1.5} />
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] text-[#6B6B6B] font-semibold leading-none">Split Type</span>
                    <span className="text-[14px] font-black text-[#1A1A1A] mt-1.5 leading-none">
                      {splitData.type === 'equal' ? 'Equal' : splitData.type === 'unequal' ? 'Unequal' : 'Adjustment'}
                    </span>
                  </div>
                </div>
                <ChevronDown size={14} className="text-[#9A9590]" />
              </button>
            </div>
          )}

          {/* Category Section */}
          <div className="flex flex-col mt-6">
            <span className="text-sm font-medium text-[#6B6B6B] tracking-wider mb-3">
              CATEGORY
            </span>
            <CategoryPicker
              selectedCategoryId={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>
        </div>

        <div className="flex flex-col shrink-0 bg-[#FEFAF1] border-t border-[#EBEBEB]/20 py-4">
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
