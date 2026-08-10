import { ChevronLeft, Download } from 'lucide-react'
import receiptMockup from '@/assets/receipt_mockup.png'

interface ReceiptPreviewFlowProps {
  isOpen: boolean
  onClose: () => void
  tx: { name?: string }
  onDownload: () => void
}

export default function ReceiptPreviewFlow({
  onClose,
  tx,
  onDownload,
}: ReceiptPreviewFlowProps) {
  return (
    <div className="flex flex-col h-full select-none overflow-y-auto pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 flex shrink-0 items-center bg-background px-6 pb-3 pt-5">
        <button
          onClick={onClose}
          className="size-10 rounded-full bg-white border border-[#EBEBEB] flex items-center justify-center cursor-pointer shadow-[0px_2px_8px_rgba(0,0,0,0.04)] outline-none"
        >
          <ChevronLeft size={20} className="text-[#1A1A1A]" />
        </button>
        <h3 className="text-lg font-extrabold text-[#1A1A1A] absolute left-1/2 -translate-x-1/2">
          Receipt Preview
        </h3>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-6 flex flex-col items-center justify-between">
        <div className="w-full max-w-[380px] bg-white rounded-[28px] border border-[#EFE7DD] shadow-[0px_8px_32px_rgba(26,26,26,0.03)] overflow-hidden flex flex-col p-3 mt-2">
          <div className="w-full bg-[#F7F5F0] rounded-[20px] overflow-hidden flex items-center justify-center border border-[#EFE7DD]/40 relative aspect-square">
            <img
              src={receiptMockup}
              alt="Uploaded Receipt"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>

          <div className="mt-4 flex items-center justify-between px-2 pb-1">
            <div className="flex flex-col text-left">
              <span className="text-[14px] font-extrabold text-[#1A1A1A] max-w-[200px] truncate">
                {tx.name ? `${tx.name.replace(/\s+/g, '_')}_Receipt.png` : 'Receipt_Hotel_Booking.png'}
              </span>
              <span className="text-[11px] font-semibold text-[#9A9590] mt-0.5">
                1.05 MB • PNG Image
              </span>
            </div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-positive bg-[#E4F2EB] px-3 py-1 rounded-full">
              Uploaded
            </div>
          </div>
        </div>

        {/* Download Action Button */}
        <button
          type="button"
          onClick={onDownload}
          className="w-full max-w-[380px] h-14 rounded-[20px] bg-positive text-white font-extrabold text-base cursor-pointer shadow-[0px_4px_16px_rgba(11,104,58,0.16)] hover:bg-positive/90 transition-all flex items-center justify-center gap-2 outline-none mt-6"
        >
          <Download size={18} />
          Download Receipt
        </button>
      </div>
    </div>
  )
}
