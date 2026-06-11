import { useState, useRef } from 'react'
import { Camera, Image as ImageIcon, ChevronRight } from 'lucide-react'
import FlowHeader from '@/components/shared/flow-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ProfilePicturePanelProps {
  currentAvatar: string | null
  initials: string
  onClose: () => void
  onSave: (newAvatar: string | null) => void
}

export default function ProfilePicturePanel({
  currentAvatar,
  initials,
  onClose,
  onSave,
}: ProfilePicturePanelProps) {
  const [tempAvatar, setTempAvatar] = useState<string | null>(currentAvatar)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setTempAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    onSave(tempAvatar)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-70 bg-[#FEFAF1] flex flex-col select-none overflow-y-auto animate-in fade-in slide-in-from-right duration-200 text-[#1A1A1A]">
      <FlowHeader
        title="Profile Picture"
        onBack={onClose}
      />

      <div className="flex-1 flex flex-col justify-between px-6 pb-8 pt-2">
        <div className="space-y-8">
          {/* Large Preview */}
          <div className="flex flex-col items-center py-4">
            <Avatar className="w-32 h-32 select-none shadow-[0px_8px_24px_0px_#0B683A3F] border-2 border-white">
              {tempAvatar ? (
                <AvatarImage src={tempAvatar} alt="Profile Preview" className="object-cover" />
              ) : (
                <AvatarFallback className="bg-[linear-gradient(140deg,#0B683A_3.67%,#14A558_96.33%)] text-white font-bold text-[36px] tracking-tight">
                  {initials || 'MH'}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-[14px] font-medium text-[#6B6B6B] mt-4 block text-center animate-pulse">
              Your current photo
            </span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Options Card */}
          <div>
            <h3 className="text-[11px] font-semibold tracking-widest text-[#6B6B6B] uppercase mb-2 px-1">
              Choose Photo
            </h3>
            <div className="bg-white border-[0.8px] border-[#E8E4DC] rounded-[18px] shadow-[0px_2px_10px_0px_rgba(0,0,0,0.05)] overflow-hidden divide-y divide-[#E8E4DC]">

              {/* Take a Photo */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-between p-4 text-left active:bg-[#FEFAF1]/80 transition-colors cursor-pointer outline-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-[13px] bg-[#E4F2EB] flex items-center justify-center text-primary shrink-0">
                    <Camera size={20} strokeWidth={2.2} />
                  </div>
                  <span className="text-[15px] font-semibold text-[#1A1A1A]">Take a Photo</span>
                </div>
                <ChevronRight size={18} className="text-[#9A9590]" strokeWidth={2.5} />
              </button>

              {/* Choose from Gallery */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-between p-4 text-left active:bg-[#FEFAF1]/80 transition-colors cursor-pointer outline-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-[13px] bg-[#E4F2EB] flex items-center justify-center text-primary shrink-0">
                    <ImageIcon size={20} strokeWidth={2.2} />
                  </div>
                  <span className="text-[15px] font-semibold text-[#1A1A1A]">Choose from Gallery</span>
                </div>
                <ChevronRight size={18} className="text-[#9A9590]" strokeWidth={2.5} />
              </button>

            </div>
          </div>
        </div>

        {/* Save Photo Button */}
        <div>
          <button
            type="button"
            onClick={handleSave}
            className="w-full h-14 bg-[#0B683A] text-white rounded-full font-bold text-base shadow-[0px_8px_20px_rgba(11,104,58,0.3)] active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
          >
            Save Photo
          </button>
        </div>
      </div>
    </div>
  )
}
