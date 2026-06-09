import { useState } from 'react'
import { FileText, ChevronRight, User, Users, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FlowHeader from '@/components/shared/flow-header'
import CategoryPicker, { CATEGORIES } from '@/features/personal/components/category-picker'
import AttachmentTabs from '@/features/personal/components/attachment-tabs'
import AddReceiptFlow from '@/components/shared/add-receipt-flow'
import AddNoteFlow from '@/components/shared/add-note-flow'
import SuccessCheck from '@/components/shared/success-check'
import PaidByDrawer from '@/components/shared/paid-by-drawer'
import SplitExpenseDrawer, { type SplitData } from '@/components/shared/split-expense-drawer'

export interface ConfirmExpenseData {
  amount: number
  description: string
  category: string
  dateValue: string
  receiptFile: { name: string; size: string; dataUrl?: string } | null
  noteText: string
  paidBy?: 'you' | 'contact'
  splitData?: SplitData
}

export interface InitialExpenseData {
  amount?: string
  description?: string
  category?: string
  dateValue?: string
  paidBy?: 'you' | 'contact'
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

  // Shared Expense Specific State
  const [paidBy, setPaidBy] = useState<'you' | 'contact'>(initialData?.paidBy || 'you')
  const [showPaidBy, setShowPaidBy] = useState(false)
  const [splitData, setSplitData] = useState<SplitData>(initialData?.splitData || {
    type: 'equal',
    selectedMembers: ['you', 'contact'],
    unequalAmounts: { you: 0, contact: 0 },
    adjustmentAmounts: { you: 0, contact: 0 },
  })
  const [showSplit, setShowSplit] = useState(false)

  const payerName = paidBy === 'you' ? 'You' : (contact?.name || 'Contact')
  const splitSummary = splitData.type === 'equal'
    ? `${splitData.selectedMembers.length} people`
    : splitData.type === 'unequal'
      ? 'Unequal'
      : 'Adjustment'

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
    setDateValue((prev) => (prev === 'Today' ? 'Tomorrow' : 'Today'))
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

  return (
    <form
      onSubmit={handleFormSubmit}
      className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none justify-between"
    >
      {/* Scrollable Container */}
      <div className="flex flex-col flex-1 pb-4">
        {/* Header */}
        <FlowHeader
          title={title}
          onBack={onBack}
          backVariant="circle"
          rightSlot={
            showPaidByAndSplit ? (
              <button
                type="submit"
                className="text-[#0B683A] font-extrabold text-base bg-transparent border-0 cursor-pointer p-2 outline-none transition-opacity"
              >
                <Check size={22} strokeWidth={2.5} />
              </button>
            ) : undefined
          }
        />

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
                className="flex-1 bg-white rounded-md border-[0.8px] border-[#EBEBEB] p-4 flex items-center justify-between cursor-pointer transition-colors outline-none shadow-[0px_1px_4px_0px_#0000000A]"
              >
                <div className="flex items-center gap-3">
                  <User size={18} className="text-[#6B6B6B]" />
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-[#6B6B6B] font-medium leading-none">Paid by</span>
                    <span className="text-[13px] font-semibold text-[#1A1A1A] mt-1.5 leading-none">{payerName}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#6B6B6B]" />
              </button>

              {/* Split between */}
              <button
                type="button"
                onClick={() => setShowSplit(true)}
                className="flex-1 bg-white rounded-md border-[0.8px] border-[#EBEBEB] p-4 flex items-center justify-between cursor-pointer transition-colors outline-none shadow-[0px_1px_4px_0px_#0000000A]"
              >
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-[#6B6B6B]" />
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-[#6B6B6B] font-medium leading-none">Split between</span>
                    <span className="text-[13px] font-semibold text-[#1A1A1A] mt-1.5 leading-none">{splitSummary}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#6B6B6B]" />
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
      </div>

      {/* Footer & Actions */}
      <div className="flex flex-col shrink-0">
        <AttachmentTabs
          dateValue={dateValue}
          receiptAttached={!!receiptFile}
          noteAttached={!!noteText}
          onToggleDate={handleToggleDate}
          onToggleReceipt={handleToggleReceipt}
          onToggleNote={handleToggleNote}
        />

        <div className="px-6 py-6">
          <Button
            type="submit"
            className="w-full h-14 rounded-full bg-primary shadow-[0px_6.29px_20.13px_0px_#0B683A4D] text-white font-bold text-base cursor-pointer transition-transform active:scale-[0.99]"
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
    </form>
  )
}
