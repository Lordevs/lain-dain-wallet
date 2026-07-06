import { ClipboardList, ChevronRight } from 'lucide-react'

interface ViewReportsCardProps {
  onClick?: () => void
}

/**
 * ViewReportsCard — Quick access card link that redirects to monthly expense reports.
 */
export default function ViewReportsCard({ onClick }: ViewReportsCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-[#EFE7DD] shadow-[0px_2px_10px_0px_#0000000D] p-5 mx-6 mt-4 flex items-center justify-between cursor-pointer transition-colors active:scale-[0.99]"
    >
      <div className="flex items-center">
        <div className="w-14 h-14 rounded-[16px] bg-[#E4F2EB] flex items-center justify-center shrink-0">
          <ClipboardList size={28} className="text-positive" strokeWidth={2} />
        </div>
        <span className="font-semibold text-lg text-[#1A1A1A] ml-4">
          View Reports
        </span>
      </div>
      <ChevronRight size={24} className="text-[#6B6B6B]" />
    </div>
  )
}
