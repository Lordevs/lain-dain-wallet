import { useState } from 'react'
import { Pencil } from 'lucide-react'
import FlowHeader from '@/components/shared/flow-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/use-auth-store'
import ProfilePicturePanel from '@/components/shared/profile-picture-panel'

interface EditProfilePanelProps {
  onClose: () => void
  onSuccess: (msg: string) => void
}

export default function EditProfilePanel({ onClose, onSuccess }: EditProfilePanelProps) {
  const { userProfile, setProfile } = useAuthStore()

  // Form states prefilled from store
  const [name, setName] = useState(userProfile?.name || 'Muhammad Huzaifa')
  const [email, setEmail] = useState(userProfile?.email || '')
  const [avatar, setAvatar] = useState<string | null>(userProfile?.avatar || null)

  const [isProfilePicOpen, setIsProfilePicOpen] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setProfile({
      ...userProfile,
      name: name.trim(),
      email: email.trim(),
      avatar: avatar
    })

    onSuccess('Profile updated successfully!')
    onClose()
  }

  const initials = name
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)

  return (
    <div className="fixed inset-0 z-60 bg-[#FEFAF1] flex flex-col select-none overflow-y-auto animate-in fade-in slide-in-from-right duration-200 text-[#1A1A1A]">
      <FlowHeader
        title="Edit Profile"
        onBack={onClose}
      />

      <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between px-6 pb-8 pt-2">
        <div className="space-y-6">
          {/* Avatar / Photo Uploader */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="w-22 h-22 select-none shadow-[0px_6px_20px_0px_#0B683A52]">
                {avatar ? (
                  <AvatarImage src={avatar} alt="Profile Picture" className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-[linear-gradient(140deg,#0B683A_3.67%,#14A558_96.33%)] text-white font-bold text-[28px] tracking-tight">
                    {initials || 'MH'}
                  </AvatarFallback>
                )}
              </Avatar>

              {/* Pencil Icon Button */}
              <button
                type="button"
                onClick={() => setIsProfilePicOpen(true)}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#0B683A] text-white border-2 border-white flex items-center justify-center shadow-md cursor-pointer active:scale-95 transition-all"
                aria-label="Upload profile image"
              >
                <Pencil size={14} className="stroke-[2.5px]" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsProfilePicOpen(true)}
              className="text-[#0B683A] font-semibold text-[15px] cursor-pointer mt-2.5 block text-center"
            >
              Change Profile Icon
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 text-left">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-widest text-[#6B6B6B] uppercase px-1">
                Full Name
              </label>
              <div className="bg-white border-[0.8px] border-[#E8E4DC] focus-within:border-[#0B683A73] rounded-[16px] px-5 py-4 transition-all shadow-[0px_2px_10px_0px_rgba(0,0,0,0.03)]">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="outline-none border-0 w-full text-[15px] font-medium text-[#1A1A1A] p-0 bg-transparent"
                  required
                  placeholder="Enter your name"
                />
              </div>
            </div>

            {/* Phone Number (Verified, Read-Only) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-widest text-[#6B6B6B] uppercase px-1">
                Phone Number
              </label>
              <div className="flex items-center justify-between bg-white border-[0.8px] border-[#E8E4DC] rounded-[16px] px-5 py-4 shadow-[0px_2px_10px_0px_rgba(0,0,0,0.03)]">
                <span className="text-[15px] font-medium text-[#1A1A1A]">
                  {userProfile?.phone || '+92 300 1234567'}
                </span>
                <span className="bg-[#E4F2EB] text-[#0B683A] text-[12px] font-bold px-3 py-1 rounded-full shrink-0 select-none">
                  Verified
                </span>
              </div>
            </div>

            {/* Email (Optional) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-widest text-[#6B6B6B] uppercase px-1">
                Email (Optional)
              </label>
              <div className="bg-white border-[0.8px] border-[#E8E4DC] focus-within:border-[#0B683A73] rounded-[16px] px-5 py-4 transition-all shadow-[0px_2px_10px_0px_rgba(0,0,0,0.03)]">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="outline-none border-0 w-full text-[15px] font-medium text-[#1A1A1A] p-0 bg-transparent"
                  placeholder="Add email address..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save Changes Button */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full h-14 bg-[#0B683A] text-white rounded-full font-bold text-base shadow-[0px_8px_20px_rgba(11,104,58,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* Profile Picture selector overlay */}
      {isProfilePicOpen && (
        <ProfilePicturePanel
          currentAvatar={avatar}
          initials={initials}
          onClose={() => setIsProfilePicOpen(false)}
          onSave={(newAvatar) => setAvatar(newAvatar)}
        />
      )}
    </div>
  )
}
