import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { ADD_CATEGORY_ICON_OPTIONS as ICON_OPTIONS } from '@/features/expenses/lib/category-icons'

const COLORS = [
  '#0B683A', // Green
  '#2F80ED', // Blue
  '#7D3C98', // Purple
  '#C96A1B', // Orange
  '#C0392B', // Red
  '#E91E63', // Pink
  '#00BCD4', // Teal/Cyan
]

interface AddCategoryFlowProps {
  isOpen: boolean
  onClose: () => void
  /** `icon` is the backend-facing icon name (see category-icons.ts), not a component */
  onSave: (name: string, icon: string, color: string) => void
}

export default function AddCategoryFlow({
  onClose,
  onSave,
}: AddCategoryFlowProps) {
  const [categoryName, setCategoryName] = useState('Food')
  const [selectedIconIndex, setSelectedIconIndex] = useState(0) // Default to Coffee
  const [selectedColor, setSelectedColor] = useState(COLORS[0]) // Default to Green

  const activeIcon = ICON_OPTIONS[selectedIconIndex].icon

  const handleSave = () => {
    if (!categoryName.trim()) return
    onSave(categoryName.trim(), ICON_OPTIONS[selectedIconIndex].name, selectedColor)
  }

  return (
    <div className="flex flex-col h-full select-none overflow-y-auto pb-8 text-foreground font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3 relative shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="size-10 flex items-center justify-start cursor-pointer bg-transparent border-0 outline-none"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        
        <h3 className="text-lg font-extrabold text-foreground">
          Add Category
        </h3>

        <button
          type="button"
          onClick={handleSave}
          disabled={!categoryName.trim()}
          className="text-positive font-extrabold text-base bg-transparent border-0 cursor-pointer p-2 outline-none hover:opacity-80 disabled:opacity-40 transition-all"
        >
          Save
        </button>
      </div>

      {/* Main Form Fields */}
      <div className="flex-1 px-6 py-4 flex flex-col gap-6 text-left">
        {/* Category Name input */}
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-muted-faint uppercase tracking-wider mb-2">
            Category Name
          </span>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="w-full h-14 px-4 rounded-[16px] border border-positive bg-white text-base font-semibold text-foreground outline-none"
            placeholder="Enter category name"
          />
        </div>

        {/* Choose Icon Grid */}
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-muted-faint uppercase tracking-wider mb-3">
            Choose Icon
          </span>
          <div className="grid grid-cols-5 gap-3">
            {ICON_OPTIONS.map((item, idx) => {
              const IconComp = item.icon
              const isSelected = selectedIconIndex === idx
              
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setSelectedIconIndex(idx)}
                  className={`aspect-square rounded-[16px] flex items-center justify-center cursor-pointer transition-all border outline-none ${
                    isSelected
                      ? 'bg-positive-soft-bg border-positive text-positive'
                      : 'bg-white border-divider text-muted-foreground hover:bg-hover-bg'
                  }`}
                >
                  <IconComp size={20} strokeWidth={1.5} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Choose Color Row */}
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-muted-faint uppercase tracking-wider mb-3">
            Choose Colour
          </span>
          <div className="flex items-center gap-3.5 flex-wrap">
            {COLORS.map((col) => {
              const isSelected = selectedColor === col
              
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => setSelectedColor(col)}
                  className={`w-9 h-9 rounded-full cursor-pointer transition-transform active:scale-95 border-2 ${
                    isSelected ? 'border-foreground scale-105' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: col }}
                />
              )
            })}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-muted-faint uppercase tracking-wider mb-3">
            Preview
          </span>
          <div className="w-full bg-white rounded-[24px] border border-divider p-5 flex items-center justify-between shadow-[0px_2px_8px_rgba(0,0,0,0.01)]">
            <span className="text-sm font-semibold text-muted-foreground">
              How it will look:
            </span>
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium border-[1.5px]"
              style={{
                backgroundColor: `${selectedColor}1A`,
                color: selectedColor,
                borderColor: `${selectedColor}33`,
              }}
            >
              {(() => {
                const ActiveIconComp = activeIcon
                return <ActiveIconComp size={18} strokeWidth={1.5} />
              })()}
              {categoryName || 'Preview'}
            </div>
          </div>
        </div>

        {/* Big Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!categoryName.trim()}
          className="w-full h-14 rounded-[20px] bg-positive text-white font-extrabold text-base cursor-pointer shadow-[0px_4px_16px_rgba(11,104,58,0.15)] hover:bg-positive/95 disabled:opacity-40 transition-all flex items-center justify-center outline-none border-0 mt-2"
        >
          Save Category
        </button>
      </div>
    </div>
  )
}
