import { useState, useEffect, useMemo } from 'react'
import { FileText, ChevronRight, ChevronDown, Calendar, Users, Check, Camera, Edit3, ChevronLeft, User, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import CategoryPicker, { CATEGORIES } from '@/features/personal/components/category-picker'
import PaidByDrawer from '@/components/shared/paid-by-drawer'
import SplitExpenseDrawer, { type SplitData } from '@/components/shared/split-expense-drawer'
import SelectDateDrawer from '@/components/shared/select-date-drawer'
import AddReceiptFlow from '@/components/shared/add-receipt-flow'
import AddNoteFlow from '@/components/shared/add-note-flow'
import SuccessCheck from '@/components/shared/success-check'
import { useRecurringStore, type RecurringPaymentRecord } from '@/store/use-recurring-store'
import { getMemberName } from '@/features/groups/data/group-members'
import { MOCK_RECEIVABLES, MOCK_PAYABLES } from '@/features/dashboard/data/mock-data'

interface AddRecurringScreenProps {
  groupId: string
  editPaymentId?: string
  onClose: () => void
  onSuccess: () => void
}

export default function AddRecurringScreen({ groupId, editPaymentId, onClose, onSuccess }: AddRecurringScreenProps) {
  const { getPayments, addPayment, updatePayment } = useRecurringStore()

  // Find the group details
  const group = useMemo(() => {
    return [...MOCK_RECEIVABLES, ...MOCK_PAYABLES].find((c) => c.id === groupId)
  }, [groupId])

  // Look up payment if editing from the Zustand store
  const editingPayment = useMemo(() => {
    if (!editPaymentId) return null
    return getPayments(groupId).find((p) => p.id === editPaymentId) ?? null
  }, [groupId, editPaymentId, getPayments])

  // Form states
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('bills')
  const [frequency, setFrequency] = useState<'Monthly' | 'Weekly'>('Monthly')
  const [dateValue, setDateValue] = useState('15 June 2026')
  const [paidBy, setPaidBy] = useState('you')
  const [splitData, setSplitData] = useState<SplitData>({
    type: 'equal',
    selectedMembers: ['you', 'contact'],
    unequalAmounts: { you: 0, contact: 0 },
    adjustmentAmounts: { you: 0, contact: 0 },
  })

  // Attachment overlay states
  const [receiptFile, setReceiptFile] = useState<{ name: string; size: string; dataUrl?: string } | null>(null)
  const [noteText, setNoteText] = useState('')

  // UI trigger states
  const [showPaidBy, setShowPaidBy] = useState(false)
  const [showSplit, setShowSplit] = useState(false)
  const [showDateDrawer, setShowDateDrawer] = useState(false)
  const [showReceiptOverlay, setShowReceiptOverlay] = useState(false)
  const [showNoteOverlay, setShowNoteOverlay] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Populate form if editing
  useEffect(() => {
    if (editingPayment) {
      setAmount(String(editingPayment.amount))
      setDescription(editingPayment.name)
      setSelectedCategory(editingPayment.category)
      setFrequency(editingPayment.frequency)
      setDateValue(editingPayment.startsOn)
      setPaidBy(editingPayment.paidById)
      setSplitData({
        type: editingPayment.splitType || 'equal',
        selectedMembers: ['you', 'contact'],
        unequalAmounts: { you: 0, contact: 0 },
        adjustmentAmounts: { you: 0, contact: 0 },
      })
    }
  }, [editingPayment])

  // Resolve payer full name from shared members list
  const payerName = useMemo(() => getMemberName(paidBy), [paidBy])

  // Amount formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '')
    setAmount(rawVal)
  }

  const getFormattedAmount = () => {
    if (!amount) return ''
    return Number(amount).toLocaleString('en-US')
  }

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const parsedAmount = Number(amount) || 0
    if (parsedAmount <= 0) return

    const record: RecurringPaymentRecord = {
      id: editingPayment ? editingPayment.id : `r-${Date.now()}`,
      name: description || 'Subscription Split',
      amount: parsedAmount,
      paidById: paidBy,
      paidByName: payerName,
      nextBillingDate: dateValue,
      nextBillingStatus: 'green',
      category: selectedCategory,
      frequency,
      startsOn: dateValue,
      splitType: splitData.type,
    }

    if (editingPayment) {
      updatePayment(groupId, record)
    } else {
      addPayment(groupId, record)
    }

    setShowSuccess(true)
  }

  const handleSuccessComplete = () => {
    onSuccess()
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-[50vh] select-none justify-center">
        <SuccessCheck onComplete={handleSuccessComplete} />
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-col flex-1 bg-[#FEFAF1] h-full select-none justify-between text-left overflow-y-auto"
    >
      <div className="flex flex-col flex-1 pb-4">
        {/* Custom Centered Header */}
        <header className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0 relative h-14 bg-[#FEFAF1]">
          {/* Back Chevron */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#0B683A] bg-transparent border-0 cursor-pointer outline-none focus:outline-none flex items-center justify-center -ml-1 shrink-0 active:scale-95"
            aria-label="Go back"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>

          {/* Centered Title */}
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[19px] font-extrabold text-[#1A1A1A] select-none text-center leading-none">
            {editingPayment ? "Edit Recurring Payment" : "Add Recurring Payment"}
          </h1>

          {/* Checkmark Action */}
          <button
            type="submit"
            className="p-1.5 text-[#0B683A] bg-transparent border-0 cursor-pointer outline-none focus:outline-none flex items-center justify-center -mr-1 shrink-0 active:scale-95"
            aria-label="Save"
          >
            <Check size={24} strokeWidth={2.5} />
          </button>
        </header>

        {/* Form Body - Tighter spacings */}
        <div className="px-5 flex flex-col mt-2 gap-4">
          {/* Amount field */}
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-[#6B6B6B] mb-1.5 px-1 uppercase tracking-wide">
              Amount
            </span>
            <div className="flex rounded-[20px] border border-[#EBEBEB] overflow-hidden bg-white shadow-[0px_2px_8px_rgba(0,0,0,0.02)] h-20 items-stretch">
              <div className="flex items-center justify-center bg-[#FFF9E6] px-6 border-r border-[#EBEBEB] select-none shrink-0">
                <span className="text-[16px] font-extrabold text-[#C96A1B] leading-none">
                  Rs.
                </span>
              </div>
              <div className="flex-1 flex items-center px-5">
                <input
                  type="text"
                  value={getFormattedAmount()}
                  onChange={handleAmountChange}
                  className="w-full bg-transparent border-0 outline-none text-[32px] font-extrabold text-[#1A1A1A] placeholder:text-[#CCCCCC] font-sans"
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description field */}
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-[#6B6B6B] mb-1.5 px-1 uppercase tracking-wide">
              What is this for?
            </span>
            <div className="flex items-center gap-3 rounded-[20px] border border-[#EBEBEB] bg-white shadow-[0px_2px_8px_rgba(0,0,0,0.02)] h-16 px-4">
              <div className="w-10 h-10 rounded-[12px] bg-[#E4F2EB] flex items-center justify-center shrink-0">
                <FileText size={18} className="text-[#0B683A]" strokeWidth={2} />
              </div>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-[15px] font-bold text-[#1A1A1A] placeholder:text-[#9A9590]"
                placeholder="What was this for?"
                required
              />
            </div>
          </div>

          {/* Paid by & Split row */}
          <div className="flex gap-4.5">
            {/* Paid By Button */}
            <button
              type="button"
              onClick={() => setShowPaidBy(true)}
              className="flex-1 bg-white rounded-[20px] border border-[#EBEBEB] px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#F7F5F0] transition-colors outline-none h-16 shadow-[0px_2px_8px_rgba(0,0,0,0.02)]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <User size={18} className="text-[#6B6B6B] shrink-0" strokeWidth={2} />
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[10px] text-[#6B6B6B] font-semibold leading-none">Paid by</span>
                  <span className="text-[13px] font-black text-[#1A1A1A] mt-1 leading-none truncate">
                    {payerName}
                  </span>
                </div>
              </div>
              <ChevronRight size={14} className="text-[#9A9590] shrink-0" />
            </button>

            {/* Split Type Button */}
            <button
              type="button"
              onClick={() => setShowSplit(true)}
              className="flex-1 bg-white rounded-[20px] border border-[#EBEBEB] px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#F7F5F0] transition-colors outline-none h-16 shadow-[0px_2px_8px_rgba(0,0,0,0.02)]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Users size={18} className="text-[#6B6B6B] shrink-0" strokeWidth={2} />
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[10px] text-[#6B6B6B] font-semibold leading-none">Split between</span>
                  <span className="text-[13px] font-black text-[#1A1A1A] mt-1 leading-none truncate">
                    {splitData.type === 'equal'
                      ? `${splitData.selectedMembers.length} people`
                      : splitData.type === 'unequal'
                        ? 'Unequal'
                        : 'Adjustment'}
                  </span>
                </div>
              </div>
              <ChevronDown size={14} className="text-[#9A9590] shrink-0" />
            </button>
          </div>

          {/* Category Picker */}
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-[#6B6B6B] mb-2 px-1 uppercase tracking-wide">
              Category
            </span>
            <CategoryPicker
              selectedCategoryId={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          {/* Repeats Tab Selector */}
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-[#6B6B6B] mb-2 px-1 uppercase tracking-wide">
              Repeats
            </span>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFrequency('Monthly')}
                className={cn(
                  "flex-1 py-3 rounded-[16px] text-[14px] font-bold transition-all cursor-pointer outline-none flex items-center justify-center gap-2 h-12 border",
                  frequency === 'Monthly'
                    ? "bg-[#E4F2EB] border-[#0B683A4D] text-[#0B683A]"
                    : "bg-transparent border-[#EBEBEB] text-[#6B6B6B]"
                )}
              >
                <RefreshCw size={14} className={frequency === 'Monthly' ? "text-[#0B683A]" : "text-[#6B6B6B]"} />
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setFrequency('Weekly')}
                className={cn(
                  "flex-1 py-3 rounded-[16px] text-[14px] font-bold transition-all cursor-pointer outline-none flex items-center justify-center gap-2 h-12 border",
                  frequency === 'Weekly'
                    ? "bg-[#E4F2EB] border-[#0B683A4D] text-[#0B683A]"
                    : "bg-transparent border-[#EBEBEB] text-[#6B6B6B]"
                )}
              >
                {frequency === 'Weekly' && <RefreshCw size={14} className="text-[#0B683A]" />}
                Weekly
              </button>
            </div>
          </div>

          {/* Starts On Calendar Trigger */}
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-[#6B6B6B] mb-2 px-1 uppercase tracking-wide">
              Starts on
            </span>
            <button
              type="button"
              onClick={() => setShowDateDrawer(true)}
              className="flex items-center justify-between w-full bg-[#F5F3ED]/75 border border-[#EBEBEB] rounded-[20px] px-5 py-3.5 text-left cursor-pointer hover:bg-[#F5F3ED] transition-colors outline-none h-14 shadow-[0px_2px_8px_rgba(0,0,0,0.01)]"
            >
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-[#0B683A]" strokeWidth={2} />
                <span className="text-[14px] font-extrabold text-[#1A1A1A]">{dateValue}</span>
              </div>
              <ChevronDown size={16} className="text-[#9A9590]" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer / Attachments Strip & Save Button */}
      <div className="flex flex-col shrink-0">
        {/* Attachments Strip */}
        <div className="flex items-center justify-between gap-12 px-12 py-4.5 shrink-0 bg-[#F7F5F0] border-t border-[#EBEBEB]">
          {/* Repeats Quick Indicator */}
          <button
            type="button"
            onClick={() => setFrequency(frequency === 'Monthly' ? 'Weekly' : 'Monthly')}
            className="flex flex-col items-center justify-center bg-transparent border-0 outline-none cursor-pointer"
          >
            <div className="w-12 h-12 rounded-[16px] bg-[#E4F2EB] flex items-center justify-center transition-all shadow-[0px_1px_4px_rgba(0,0,0,0.02)]">
              <RefreshCw size={18} className="text-[#0B683A]" strokeWidth={2} />
            </div>
            <span className="text-[11px] font-extrabold mt-1.5 text-[#0B683A]">
              {frequency}
            </span>
          </button>

          {/* Receipt Trigger */}
          <button
            type="button"
            onClick={() => setShowReceiptOverlay(true)}
            className="flex flex-col items-center justify-center bg-transparent border-0 outline-none cursor-pointer"
          >
            <div className={cn(
              "w-12 h-12 rounded-[16px] flex items-center justify-center transition-all",
              receiptFile
                ? "bg-[#FFF9E6] border border-[#FDB105]/50"
                : "bg-white border border-[#EBEBEB] shadow-[0px_1px_4px_rgba(0,0,0,0.02)]"
            )}>
              <Camera size={18} className={receiptFile ? "text-[#C96A1B]" : "text-[#FDB105]"} strokeWidth={2} />
            </div>
            <span className={cn(
              "text-[11px] font-extrabold mt-1.5 transition-colors",
              receiptFile ? "text-[#C96A1B]" : "text-[#6B6B6B]"
            )}>
              {receiptFile ? "Receipt ✓" : "Receipt"}
            </span>
          </button>

          {/* Note Trigger */}
          <button
            type="button"
            onClick={() => setShowNoteOverlay(true)}
            className="flex flex-col items-center justify-center bg-transparent border-0 outline-none cursor-pointer"
          >
            <div className={cn(
              "w-12 h-12 rounded-[16px] flex items-center justify-center transition-all",
              noteText
                ? "bg-[#E3F2FD] border border-[#1F618D]/50"
                : "bg-white border border-[#EBEBEB] shadow-[0px_1px_4px_rgba(0,0,0,0.02)]"
            )}>
              <Edit3 size={18} className={noteText ? "text-[#1F618D]" : "text-[#6B6B6B]"} strokeWidth={2} />
            </div>
            <span className={cn(
              "text-[11px] font-extrabold mt-1.5 transition-colors",
              noteText ? "text-[#1F618D]" : "text-[#6B6B6B]"
            )}>
              {noteText ? "Note ✓" : "Note"}
            </span>
          </button>
        </div>

        {/* Primary Save Button */}
        <div className="px-6 py-6 bg-[#FEFAF1]">
          <button
            type="submit"
            className="w-full h-14 rounded-full bg-[#0B683A] shadow-[0px_6px_20px_rgba(11,104,58,0.3)] text-white font-bold text-[16px] cursor-pointer transition-transform active:scale-[0.99] border-0 flex items-center justify-center"
          >
            Save Recurring Payment
          </button>
        </div>
      </div>

      {/* Attachments Flows (Receipt / Note) */}
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

      {/* Drawers (PaidBy / Split / Date) */}
      {group && (
        <PaidByDrawer
          isOpen={showPaidBy}
          onClose={() => setShowPaidBy(false)}
          selectedValue={paidBy}
          onSelect={setPaidBy}
          contactName={group.name}
          contactInitials={group.initials}
          contactAvatarColor={group.avatarColor}
          amount={Number(amount) || 0}
        />
      )}

      {group && (
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
          contactName={group.name}
          contactInitials={group.initials}
          contactAvatarColor={group.avatarColor}
          isRecurring={true}
          frequency={frequency}
          startsOn={dateValue}
        />
      )}

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
