import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Pencil, AlertCircle, User } from 'lucide-react'
import FlowHeader from '@/components/shared/flow-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/use-auth-store'
import { ROUTES } from '@/constants/routes'
import { useUpdateProfileMutation } from '@/features/auth/api/use-auth-mutations'
import { buildProfileFormData } from '@/features/auth/api/build-profile-form-data'
import { mapUserToProfile } from '@/features/auth/api/map-user'

interface EditProfilePanelProps {
  onClose?: () => void
  onSuccess?: (msg: string) => void
}

export default function EditProfilePanel({
  onClose = () => window.history.back(),
  onSuccess,
}: EditProfilePanelProps) {
  const navigate = useNavigate()
  const { userProfile, setProfile } = useAuthStore()
  const updateProfile = useUpdateProfileMutation()

  // Local edit buffer, deliberately NOT synced to the store on every
  // keystroke (the previous version did that) — that let an unsaved edit
  // leak into every other screen reading the store before it was ever
  // sent to the backend. The store only updates once the save actually
  // succeeds, from the server's own response.
  const [name, setName] = useState(userProfile?.name ?? '')
  const [email, setEmail] = useState(userProfile?.email ?? '')
  const avatar = userProfile?.avatar || null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const formData = await buildProfileFormData({ fullName: name.trim(), email: email.trim() })
    updateProfile.mutate(formData, {
      onSuccess: (user) => {
        setProfile(mapUserToProfile(user))
        onSuccess?.('Profile updated successfully!')
        onClose()
      },
    })
  }

  const initials = name
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-[#FEFAF1] flex flex-col select-none overflow-y-auto text-[#1A1A1A]">
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
                    {initials || <User size={32} />}
                  </AvatarFallback>
                )}
              </Avatar>

              {/* Pencil Icon Button */}
              <button
                type="button"
                onClick={() => navigate({ to: ROUTES.USER_PHOTO })}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-positive text-white border-2 border-white flex items-center justify-center shadow-md cursor-pointer active:scale-95 transition-all"
                aria-label="Upload profile image"
              >
                <Pencil size={14} className="stroke-[2.5px]" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate({ to: ROUTES.USER_PHOTO })}
              className="text-positive font-semibold text-[15px] cursor-pointer mt-2.5 block text-center"
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
                  {userProfile?.phone}
                </span>
                <span className="bg-[#E4F2EB] text-positive text-[12px] font-bold px-3 py-1 rounded-full shrink-0 select-none">
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
          {updateProfile.isError && (
            <div className="flex items-start gap-2 mb-4 text-tertiary justify-center">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{updateProfile.error.message}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={!name.trim() || updateProfile.isPending}
            className="w-full h-14 bg-positive text-white rounded-full font-bold text-base shadow-[0px_8px_20px_rgba(11,104,58,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
          >
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

    </div>
  )
}
