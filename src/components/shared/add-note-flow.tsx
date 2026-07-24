import { useState } from 'react'
import FlowHeader from '@/components/shared/flow-header'
import { CATEGORIES } from './category-picker'

interface AddNoteFlowProps {
  isOpen: boolean
  amount: number
  description: string
  category: string
  initialNote: string
  onClose: () => void
  onSave: (noteText: string) => void
}

const MAX_CHARACTERS = 300

export default function AddNoteFlow(props: AddNoteFlowProps) {
  // Only mounted while open, so AddNoteFlowContent always starts fresh from the
  // current initialNote - no effect needed to resync on reopen.
  if (!props.isOpen) return null
  return <AddNoteFlowContent {...props} />
}

function AddNoteFlowContent({
  amount,
  description,
  category,
  initialNote,
  onClose,
  onSave,
}: AddNoteFlowProps) {
  const [noteText, setNoteText] = useState(initialNote)

  // Resolve category details
  const activeCategory = CATEGORIES.find((cat) => cat.id === category) || CATEGORIES.find((cat) => cat.id === 'other')
  const CategoryIcon = activeCategory?.icon || CATEGORIES[7].icon
  const categoryColor = activeCategory?.color || '#7F8C8D'
  const categoryLabel = activeCategory?.label || 'Other'

  // Format currency
  const formattedAmount = amount ? amount.toLocaleString('en-US') : '0'

  const charactersRemaining = Math.max(0, MAX_CHARACTERS - noteText.length)

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    if (text.length <= MAX_CHARACTERS) {
      setNoteText(text)
    }
  }

  const handleQuickNoteClick = (quickNote: string) => {
    setNoteText((prev) => {
      if (!prev.trim()) {
        return quickNote
      }
      const nextNote = `${prev.trim()} ${quickNote}`
      return nextNote.slice(0, MAX_CHARACTERS)
    })
  }

  const handleSave = () => {
    onSave(noteText)
  }

  return (
    <div className="fixed inset-0 z-70 bg-background flex flex-col select-none overflow-y-auto">
      {/* Header */}
      <FlowHeader
        title="Add Note"
        onBack={onClose}
        backVariant="circle"
        rightSlot={
          <button
            type="button"
            onClick={handleSave}
            className="text-positive font-semibold text-sm bg-transparent border-0 cursor-pointer p-2 outline-none hover:opacity-85 transition-opacity"
          >
            Done
          </button>
        }
      />

      <div className="flex-1 px-6 flex flex-col justify-between pb-8 mt-2">
        {/* Upper/Content Section */}
        <div className="flex flex-col">
          {/* Transaction Summary Card */}
          <div className="w-full bg-white rounded-lg border-[0.8px] border-divider p-4 flex items-center gap-3.5 shadow-[0px_1px_4px_0px_#0000000A] select-none mb-6">
            {/* Category Icon */}
            <div
              style={{ backgroundColor: `${categoryColor}1A` }}
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            >
              <CategoryIcon size={22} style={{ color: categoryColor }} strokeWidth={1.5} />
            </div>
            {/* Labels */}
            <div className="flex flex-col text-left">
              <span className="font-semibold text-sm text-foreground">
                {categoryLabel}
              </span>
              <span className="text-xs text-muted-foreground font-normal mt-0.5">
                Rs. {formattedAmount} · {description || 'No description added'}
              </span>
            </div>
          </div>

          {/* Text Area Section */}
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-semibold text-muted-foreground tracking-wider mb-2 select-none uppercase">
              YOUR NOTE
            </span>
            <textarea
              value={noteText}
              onChange={handleTextChange}
              placeholder="Enter your note here..."
              className="w-full h-36 px-4 py-3 bg-white border-[0.8px] border-[#D9D9D9] rounded-lg text-[15px] outline-none text-foreground resize-none font-medium placeholder:text-muted-faint shadow-[0px_1px_4px_0px_#0000000A] focus:border-positive/45 transition-colors"
            />
            {/* Character count remaining */}
            <span className="text-xs text-muted-foreground mt-3 font-normal">
              {charactersRemaining} characters remaining
            </span>
          </div>

          {/* Quick Notes Section */}
          <div className="flex flex-col text-left mt-6">
            <span className="text-xs font-bold text-muted-foreground tracking-wider mb-3 select-none uppercase">
              QUICK NOTES
            </span>
            <div className="flex flex-wrap gap-2.5">
              {[
                'Cash Payment',
                'Card Payment',
                'Partial Payment',
                'Need to Verify',
              ].map((pillText) => (
                <button
                  key={pillText}
                  type="button"
                  onClick={() => handleQuickNoteClick(pillText)}
                  className="flex items-center justify-center bg-white rounded-full border-[0.8px] border-divider px-4 py-2.5 text-[13px] font-semibold text-muted-foreground cursor-pointer hover:bg-hover-bg transition-colors outline-none"
                >
                  {pillText}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save Note primary action button */}
        <div className="mt-8">
          <button
            type="button"
            onClick={handleSave}
            className="w-full h-14 rounded-[18px] bg-positive text-white font-extrabold text-base cursor-pointer shadow-[0px_6.29px_20.13px_0px_#0B683A4D] hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center outline-none"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  )
}
