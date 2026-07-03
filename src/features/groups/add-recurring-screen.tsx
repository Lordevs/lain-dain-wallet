import { useState, useMemo } from 'react'
import { FileText, ChevronRight, ChevronDown, Calendar, Users, User } from 'lucide-react'
import { useFormattedAmountInput } from '@/hooks/use-formatted-amount-input'
import CategoryPicker, { CATEGORIES } from '@/features/personal/components/category-picker'
import PaidByDrawer from '@/components/shared/paid-by-drawer'
import SplitExpenseDrawer, { type SplitData } from '@/components/shared/split-expense-drawer'
import SelectDateDrawer from '@/components/shared/select-date-drawer'
import AddReceiptFlow from '@/components/shared/add-receipt-flow'
import AddNoteFlow from '@/components/shared/add-note-flow'
import SuccessCheck from '@/components/shared/success-check'
import { useRecurringStore, type RecurringPaymentRecord } from '@/store/use-recurring-store'
import { getMemberName } from '@/features/groups/data/group-members'
import { useContactStore } from '@/store/use-contact-store'
import RecurringFormHeader from '@/features/groups/components/recurring-form-header'
import FrequencyToggle, { type RecurringFrequency } from '@/features/groups/components/frequency-toggle'
import RecurringAttachmentsStrip from '@/features/groups/components/recurring-attachments-strip'

interface AddRecurringScreenProps {
  groupId: string
  editPaymentId?: string
  onClose: () => void
  onSuccess: () => void
}

export default function AddRecurringScreen({ groupId, editPaymentId, onClose, onSuccess }: AddRecurringScreenProps) {
  const { getPayments, addPayment, updatePayment } = useRecurringStore()

  // Find the group details
  const contacts = useContactStore((state) => state.contacts)
  const group = useMemo(() => {
    return contacts.find((c) => c.id === groupId)
  }, [groupId, contacts])

  // Look up payment if editing from the Zustand store
  const editingPayment = useMemo(() => {
    if (!editPaymentId) return null
    return getPayments(groupId).find((p) => p.id === editPaymentId) ?? null
  }, [groupId, editPaymentId, getPayments])

  // Form states - lazily seeded from editingPayment on mount. This component is only ever
  // mounted fresh when the drawer opens (see recurring-payments-screen.tsx), so a plain
  // lazy initializer is enough; no effect is needed to resync on reopen.
  const { amount, handleAmountChange, formattedAmount } = useFormattedAmountInput(
    editingPayment ? String(editingPayment.amount) : ''
  )
  const [description, setDescription] = useState(() => editingPayment?.name ?? '')
  const [selectedCategory, setSelectedCategory] = useState(() => editingPayment?.category ?? 'bills')
  const [frequency, setFrequency] = useState<RecurringFrequency>(() => editingPayment?.frequency ?? 'Monthly')
  const [dateValue, setDateValue] = useState(() => editingPayment?.startsOn ?? '15 June 2026')
  const [paidBy, setPaidBy] = useState(() => editingPayment?.paidById ?? 'you')
  const [splitData, setSplitData] = useState<SplitData>(() => ({
    type: editingPayment?.splitType || 'equal',
    selectedMembers: ['you', 'contact'],
    unequalAmounts: { you: 0, contact: 0 },
    adjustmentAmounts: { you: 0, contact: 0 },
  }))

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

  // Resolve payer full name from shared members list
  const payerName = useMemo(() => getMemberName(paidBy), [paidBy])

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
      <div className="flex flex-col flex-1 bg-background min-h-[50vh] select-none justify-center">
        <SuccessCheck onComplete={handleSuccessComplete} />
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSave}
      className="fixed inset-0 z-60 flex flex-col bg-background select-none justify-between text-left overflow-y-auto"
    >
      <div className="flex flex-col flex-1 pb-4">
        <RecurringFormHeader
          title={editingPayment ? "Edit Recurring Payment" : "Add Recurring Payment"}
          onBack={onClose}
        />

        {/* Form Body - Tighter spacings */}
        <div className="px-5 flex flex-col mt-2 gap-4">
          {/* Amount field */}
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-muted-foreground mb-1.5 px-1 uppercase tracking-wide">
              Amount
            </span>
            <div className="flex rounded-[20px] border border-divider overflow-hidden bg-white shadow-[0px_2px_8px_rgba(0,0,0,0.02)] h-20 items-stretch">
              <div className="flex items-center justify-center bg-[#FFF9E6] px-6 border-r border-divider select-none shrink-0">
                <span className="text-[16px] font-extrabold text-orange-payable leading-none">
                  Rs.
                </span>
              </div>
              <div className="flex-1 flex items-center px-5">
                <input
                  type="text"
                  inputMode='decimal'
                  value={formattedAmount}
                  onChange={handleAmountChange}
                  className="w-full bg-transparent border-0 outline-none text-[32px] font-extrabold text-foreground placeholder:text-[#CCCCCC] font-sans"
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description field */}
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-muted-foreground mb-1.5 px-1 uppercase tracking-wide">
              What is this for?
            </span>
            <div className="flex items-center gap-3 rounded-[20px] border border-divider bg-white shadow-[0px_2px_8px_rgba(0,0,0,0.02)] h-16 px-4">
              <div className="w-10 h-10 rounded-[12px] bg-positive-soft-bg flex items-center justify-center shrink-0">
                <FileText size={18} className="text-positive" strokeWidth={2} />
              </div>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-[15px] font-bold text-foreground placeholder:text-muted-faint"
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
              className="flex-1 bg-white rounded-[20px] border border-divider px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-hover-bg transition-colors outline-none h-16 shadow-[0px_2px_8px_rgba(0,0,0,0.02)]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <User size={18} className="text-muted-foreground shrink-0" strokeWidth={2} />
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[10px] text-muted-foreground font-semibold leading-none">Paid by</span>
                  <span className="text-[13px] font-black text-foreground mt-1 leading-none truncate">
                    {payerName}
                  </span>
                </div>
              </div>
              <ChevronRight size={14} className="text-muted-faint shrink-0" />
            </button>

            {/* Split Type Button */}
            <button
              type="button"
              onClick={() => setShowSplit(true)}
              className="flex-1 bg-white rounded-[20px] border border-divider px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-hover-bg transition-colors outline-none h-16 shadow-[0px_2px_8px_rgba(0,0,0,0.02)]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Users size={18} className="text-muted-foreground shrink-0" strokeWidth={2} />
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[10px] text-muted-foreground font-semibold leading-none">Split between</span>
                  <span className="text-[13px] font-black text-foreground mt-1 leading-none truncate">
                    {splitData.type === 'equal'
                      ? `${splitData.selectedMembers.length} people`
                      : splitData.type === 'unequal'
                        ? 'Unequal'
                        : 'Adjustment'}
                  </span>
                </div>
              </div>
              <ChevronDown size={14} className="text-muted-faint shrink-0" />
            </button>
          </div>

          {/* Category Picker */}
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-muted-foreground mb-2 px-1 uppercase tracking-wide">
              Category
            </span>
            <CategoryPicker
              selectedCategoryId={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          {/* Repeats Tab Selector */}
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-muted-foreground mb-2 px-1 uppercase tracking-wide">
              Repeats
            </span>
            <FrequencyToggle frequency={frequency} onChange={setFrequency} />
          </div>

          {/* Starts On Calendar Trigger */}
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-muted-foreground mb-2 px-1 uppercase tracking-wide">
              Starts on
            </span>
            <button
              type="button"
              onClick={() => setShowDateDrawer(true)}
              className="flex items-center justify-between w-full bg-[#F5F3ED]/75 border border-divider rounded-[20px] px-5 py-3.5 text-left cursor-pointer hover:bg-[#F5F3ED] transition-colors outline-none h-14 shadow-[0px_2px_8px_rgba(0,0,0,0.01)]"
            >
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-positive" strokeWidth={2} />
                <span className="text-[14px] font-extrabold text-foreground">{dateValue}</span>
              </div>
              <ChevronDown size={16} className="text-muted-faint" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer / Attachments Strip & Save Button */}
      <div className="flex flex-col shrink-0">
        <RecurringAttachmentsStrip
          frequency={frequency}
          onToggleFrequency={() => setFrequency(frequency === 'Monthly' ? 'Weekly' : 'Monthly')}
          hasReceipt={!!receiptFile}
          onToggleReceipt={() => setShowReceiptOverlay(true)}
          hasNote={!!noteText}
          onToggleNote={() => setShowNoteOverlay(true)}
        />

        {/* Primary Save Button */}
        <div className="px-6 py-6 bg-background">
          <button
            type="submit"
            className="w-full h-14 rounded-full bg-positive shadow-[0px_6px_20px_rgba(11,104,58,0.3)] text-white font-bold text-[16px] cursor-pointer transition-transform active:scale-[0.99] border-0 flex items-center justify-center"
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
