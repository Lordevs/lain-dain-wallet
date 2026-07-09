import { useState } from 'react'
import { Camera, Image as ImageIcon, ChevronRight } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { takePhoto, pickFromGallery } from '@/lib/camera'
import { haptic } from '@/lib/haptics'
import FlowHeader from '@/components/shared/flow-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ProfilePicturePanelProps {
  currentAvatar: string | null
  initials?: string
  title?: string
  label?: string
  onClose: () => void
  onSave: (newAvatar: string | null) => void
}

export default function ProfilePicturePanel({
  currentAvatar,
  initials = 'MH',
  title = 'Profile Picture',
  label = 'Your current photo',
  onClose,
  onSave,
}: ProfilePicturePanelProps) {
  const [tempAvatar, setTempAvatar] = useState<string | null>(currentAvatar)

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleTakePhoto = async () => {
    haptic.light()
    if (Capacitor.isNativePlatform()) {
      const photo = await takePhoto()
      if (photo?.webPath) setTempAvatar(photo.webPath)
    } else {
      // Web fallback: file input
      openWebFilePicker((url) => setTempAvatar(url))
    }
  }

  const handlePickGallery = async () => {
    haptic.light()
    if (Capacitor.isNativePlatform()) {
      const photo = await pickFromGallery()
      if (photo?.webPath) setTempAvatar(photo.webPath)
    } else {
      openWebFilePicker((url) => setTempAvatar(url))
    }
  }

  const handleSave = () => {
    haptic.success()
    onSave(tempAvatar)
    onClose()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col select-none overflow-y-auto text-foreground">
      <FlowHeader
        title={title}
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
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-[14px] font-medium text-muted-foreground mt-4 block text-center animate-pulse">
              {label}
            </span>
          </div>

          {/* Options Card */}
          <div>
            <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-2 px-1">
              Choose Photo
            </h3>
            <div className="bg-white border-[0.8px] border-[#E8E4DC] rounded-[18px] shadow-[0px_2px_10px_0px_rgba(0,0,0,0.05)] overflow-hidden divide-y divide-[#E8E4DC]">

              {/* Take a Photo */}
              <button
                type="button"
                onClick={handleTakePhoto}
                className="w-full flex items-center justify-between p-4 text-left active:bg-background/80 transition-colors cursor-pointer outline-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-[13px] bg-positive-soft-bg flex items-center justify-center text-primary shrink-0">
                    <Camera size={20} strokeWidth={2.2} />
                  </div>
                  <span className="text-[15px] font-semibold text-foreground">Take a Photo</span>
                </div>
                <ChevronRight size={18} className="text-muted-faint" strokeWidth={2.5} />
              </button>

              {/* Choose from Gallery */}
              <button
                type="button"
                onClick={handlePickGallery}
                className="w-full flex items-center justify-between p-4 text-left active:bg-background/80 transition-colors cursor-pointer outline-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-[13px] bg-positive-soft-bg flex items-center justify-center text-primary shrink-0">
                    <ImageIcon size={20} strokeWidth={2.2} />
                  </div>
                  <span className="text-[15px] font-semibold text-foreground">Choose from Gallery</span>
                </div>
                <ChevronRight size={18} className="text-muted-faint" strokeWidth={2.5} />
              </button>

            </div>
          </div>
        </div>

        {/* Save Photo Button */}
        <div>
          <button
            type="button"
            onClick={handleSave}
            className="w-full h-14 bg-positive text-white rounded-full font-bold text-base shadow-[0px_8px_20px_rgba(11,104,58,0.3)] active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
          >
            Save Photo
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Web fallback helper ──────────────────────────────────────────────────────
// Creates a temporary <input type="file"> for browser dev mode only

function openWebFilePicker(onPicked: (objectUrl: string) => void) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    const file = input.files?.[0]
    if (file) onPicked(URL.createObjectURL(file))
  }
  input.click()
}
