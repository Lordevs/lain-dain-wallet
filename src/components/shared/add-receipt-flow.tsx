import { useState, useRef, useEffect } from 'react'
import { Camera, Image as ImageIcon, FileText, RotateCcw, Trash2, X } from 'lucide-react'
import FlowHeader from '@/components/shared/flow-header'
import { CATEGORIES } from '../../features/personal/components/category-picker'

interface ReceiptFile {
  name: string
  size: string
  dataUrl?: string
}

interface AddReceiptFlowProps {
  isOpen: boolean
  amount: number
  description: string
  category: string
  onClose: () => void
  onSave: (file: ReceiptFile | null) => void
  initialFile?: ReceiptFile | null
}

export default function AddReceiptFlow({
  isOpen,
  amount,
  description,
  category,
  onClose,
  onSave,
  initialFile = null,
}: AddReceiptFlowProps) {
  const [tempFile, setTempFile] = useState<ReceiptFile | null>(initialFile)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync state if initialFile changes
  useEffect(() => {
    setTempFile(initialFile)
  }, [initialFile, isOpen])

  if (!isOpen) return null

  // Resolve category details
  const activeCategory = CATEGORIES.find((cat) => cat.id === category) || CATEGORIES.find((cat) => cat.id === 'other')
  const CategoryIcon = activeCategory?.icon || CATEGORIES[7].icon
  const categoryColor = activeCategory?.color || '#7F8C8D'
  const categoryLabel = activeCategory?.label || 'Other'

  // Format currency
  const formattedAmount = amount ? amount.toLocaleString('en-US') : '0'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Convert file size to human-readable format
    const sizeInMB = file.size / (1024 * 1024)
    const formattedSize =
      sizeInMB < 0.1 ? `${(file.size / 1024).toFixed(1)} KB` : `${sizeInMB.toFixed(1)} MB`

    // Generate blob URL for local preview if needed
    const dataUrl = URL.createObjectURL(file)

    setTempFile({
      name: file.name,
      size: formattedSize,
      dataUrl,
    })
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    setTempFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDone = () => {
    onSave(tempFile)
  }

  return (
    <div className="fixed inset-0 z-70 bg-[#FEFAF1] flex flex-col select-none overflow-y-auto animate-in fade-in slide-in-from-right duration-200">
      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,application/pdf"
      />

      {/* Header */}
      <FlowHeader
        title="Add Receipt"
        onBack={onClose}
        backVariant="circle"
        rightSlot={
          tempFile ? (
            <button
              type="button"
              onClick={handleDone}
              className="text-[#0B683A] font-extrabold text-base bg-transparent border-0 cursor-pointer p-2 outline-none hover:opacity-85 transition-opacity"
            >
              Done
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 px-6 flex flex-col justify-between pb-8 mt-2">
        {/* Top/Middle Section */}
        <div className="flex flex-col gap-6">
          {/* Transaction Summary Card (Empty State) */}
          {!tempFile && (
            <div className="w-full bg-white rounded-2xl border-[0.8px] border-[#EBEBEB] p-4 flex items-center gap-3.5 shadow-[0px_2px_10px_rgba(0,0,0,0.03)] select-none">
              {/* Category Icon Container */}
              <div
                style={{ backgroundColor: `${categoryColor}1A` }}
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              >
                <CategoryIcon size={22} style={{ color: categoryColor }} strokeWidth={1.5} />
              </div>
              {/* Labels */}
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-[15px] text-[#1A1A1A]">
                  {categoryLabel} • Rs. {formattedAmount}
                </span>
                <span className="text-xs text-[#6B6B6B] font-semibold mt-0.5">
                  {description || 'No description added'}
                </span>
              </div>
            </div>
          )}

          {/* Large Upload Zone / File Preview */}
          {!tempFile ? (
            /* Empty State Box */
            <button
              type="button"
              onClick={triggerFileSelect}
              className="w-full h-72 rounded-[24px] border-[1.5px] border-dashed border-[#C0BCAE] bg-white flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/70 outline-none"
            >
              <div className="w-16 h-16 rounded-[18px] bg-[#E4F2EB] flex items-center justify-center">
                <Camera size={26} className="text-[#0B683A]" strokeWidth={1.5} />
              </div>
              <span className="text-base font-extrabold text-[#1A1A1A] mt-4">Upload Receipt</span>
              <span className="text-[13px] text-[#9A9590] mt-1 font-semibold">
                Tap to take photo or choose from gallery
              </span>
            </button>
          ) : (
            /* Uploaded State Box */
            <div className="w-full h-72 rounded-[24px] bg-[#F2F9F6] border-[0.8px] border-[#E2EBE7] flex flex-col items-center justify-center relative shadow-[0px_4px_16px_rgba(11,104,58,0.03)] select-none">
              {/* Close Button Top-Left */}
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-4 left-4 size-8 rounded-full bg-black/40 text-white flex items-center justify-center cursor-pointer transition-colors hover:bg-black/50 border-0 outline-none"
                aria-label="Remove receipt file"
              >
                <X size={16} strokeWidth={2.5} />
              </button>

              <FileText size={56} className="text-[#A2B5AD]" strokeWidth={1.25} />
              <span className="text-base font-extrabold text-[#1A1A1A] mt-4 px-6 text-center truncate max-w-full">
                {tempFile.name}
              </span>
              <span className="text-[13px] text-[#9A9590] mt-1 font-semibold">
                {tempFile.size} • Uploaded
              </span>
            </div>
          )}
        </div>

        {/* Bottom Actions Section */}
        <div className="flex flex-col gap-4 mt-6">
          {!tempFile ? (
            <>
              {/* Three Option Cards (Camera, Gallery, Files) */}
              <div className="flex items-center gap-3 w-full">
                {/* Camera Card */}
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  className="flex-1 bg-white rounded-2xl border-[0.8px] border-[#EBEBEB] py-5 flex flex-col items-center justify-center cursor-pointer hover:bg-[#F7F5F0] transition-colors outline-none"
                >
                  <Camera size={22} className="text-[#0B683A]" strokeWidth={1.5} />
                  <span className="text-[13px] font-extrabold text-[#1A1A1A] mt-2">Camera</span>
                </button>

                {/* Gallery Card */}
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  className="flex-1 bg-white rounded-2xl border-[0.8px] border-[#EBEBEB] py-5 flex flex-col items-center justify-center cursor-pointer hover:bg-[#F7F5F0] transition-colors outline-none"
                >
                  <ImageIcon size={22} className="text-[#0B683A]" strokeWidth={1.5} />
                  <span className="text-[13px] font-extrabold text-[#1A1A1A] mt-2">Gallery</span>
                </button>

                {/* Files Card */}
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  className="flex-1 bg-white rounded-2xl border-[0.8px] border-[#EBEBEB] py-5 flex flex-col items-center justify-center cursor-pointer hover:bg-[#F7F5F0] transition-colors outline-none"
                >
                  <FileText size={22} className="text-[#0B683A]" strokeWidth={1.5} />
                  <span className="text-[13px] font-extrabold text-[#1A1A1A] mt-2">Files</span>
                </button>
              </div>

              {/* Skip for Now pill button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full h-14 rounded-full border-[0.8px] border-[#EBEBEB] bg-white text-[#6B6B6B] font-bold text-base cursor-pointer hover:bg-[#F7F5F0] transition-all flex items-center justify-center outline-none"
              >
                Skip for now
              </button>
            </>
          ) : (
            /* Replace & Remove buttons row */
            <div className="flex items-center gap-4 w-full">
              {/* Replace */}
              <button
                type="button"
                onClick={triggerFileSelect}
                className="flex-1 h-13 rounded-full border-[0.8px] border-[#EBEBEB] bg-white text-[#1A1A1A] font-bold text-sm cursor-pointer hover:bg-[#F7F5F0] transition-all flex items-center justify-center gap-2 outline-none"
              >
                <RotateCcw size={16} strokeWidth={2.5} />
                Replace
              </button>

              {/* Remove */}
              <button
                type="button"
                onClick={handleRemove}
                className="flex-1 h-13 rounded-full bg-[#FFF0F0] text-[#C0392B] border-[0.8px] border-[#FADBD8] font-bold text-sm cursor-pointer hover:bg-[#FADBD8]/40 transition-all flex items-center justify-center gap-2 outline-none"
              >
                <Trash2 size={16} strokeWidth={2} />
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
