import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import FlowHeader from '@/components/shared/flow-header'
import CategoryPicker from './components/category-picker'
import AttachmentTabs from './components/attachment-tabs'
import AddReceiptFlow from '../../components/shared/add-receipt-flow'
import AddNoteFlow from '../../components/shared/add-note-flow'
import SuccessCheck from '../../components/shared/success-check'
import { FILTER_DATA } from './data/mock-data'

interface ReceiptFile {
  name: string
  size: string
  dataUrl?: string
}

export default function AddEntryScreen() {
  const navigate = useNavigate()

  // State management
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('bills')
  const [dateValue, setDateValue] = useState('Today')
  const [receiptFile, setReceiptFile] = useState<ReceiptFile | null>(null)
  const [showReceiptOverlay, setShowReceiptOverlay] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [showNoteOverlay, setShowNoteOverlay] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

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
  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = Number(amount) || 0
    if (parsedAmount <= 0) return

    // Create a new expense item
    const newExpense = {
      id: Date.now().toString(),
      name: description || 'Unnamed Expense',
      subtitle: 'You paid',
      amount: parsedAmount,
      currency: 'PKR',
      category: (selectedCategory === 'bills'
        ? 'shopping'
        : selectedCategory === 'grocery'
          ? 'shopping'
          : selectedCategory === 'transport'
            ? 'fuel'
            : selectedCategory === 'fuel'
              ? 'fuel'
              : 'other') as any, // maps to allowed tags
    }

    // Add to in-memory datasets
    FILTER_DATA.this_month.expenses.push(newExpense)
    FILTER_DATA.all_time.expenses.push(newExpense)

    // Increment summaries
    FILTER_DATA.this_month.summary.totalSpent += parsedAmount
    FILTER_DATA.all_time.summary.totalSpent += parsedAmount

    // Show success screen instead of navigating immediately
    setShowSuccess(true)
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none justify-between">
        <SuccessCheck onComplete={() => navigate({ to: ROUTES.PERSONAL })} />
      </div>
    )
  }

  return (
    <form
      onSubmit={handleConfirm}
      className="flex flex-col flex-1 bg-[#FEFAF1] min-h-screen select-none justify-between"
    >
      {/* Scrollable Container */}
      <div className="flex flex-col flex-1 pb-4">
        {/* Header */}
        <FlowHeader
          title="Add Entry"
          onBack={() => navigate({ to: ROUTES.PERSONAL })}
          backVariant="circle"
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
              WHAT IS THIS FOR?
            </span>
            <div className="flex items-center gap-3 rounded-[18px] border-[0.8px] border-[#0B683A73] bg-white shadow-[0px_2px_10px_0px_#0000000D] h-14 px-4">
              <FileText size={18} className="text-[#0B683A] shrink-0" strokeWidth={1.5} />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-[15px] font-bold text-[#1A1A1A] placeholder:text-[#9A9590] py-1"
                placeholder="Dinner at Monal"
                required
              />
            </div>
          </div>

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
    </form>
  )
}
