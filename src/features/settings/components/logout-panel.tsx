import { LogOut } from 'lucide-react'
import FlowHeader from '@/components/shared/flow-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/use-auth-store'

interface LogoutPanelProps {
  onClose: () => void
  onConfirm: () => void
}

export default function LogoutPanel({ onClose, onConfirm }: LogoutPanelProps) {
  const { userProfile } = useAuthStore()

  const displayName = userProfile?.name || 'Muhammad Huzaifa'
  const displayPhone = userProfile?.phone || '+92 300 1234567'

  const initials = displayName
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)

  return (
    <div className="fixed inset-0 z-60 bg-[#FEFAF1] flex flex-col select-none overflow-y-auto text-[#1A1A1A]">
      <FlowHeader
        title="Log Out"
        onBack={onClose}
      />

      <div className="flex-1 flex flex-col justify-between px-6 pb-10 pt-2">
        <div className="flex flex-col items-center text-center mt-[76px]">
          {/* Large Logout Icon circle wrapper with soft glow and subtle outline */}
          <div className="w-[110px] h-[110px] rounded-full bg-[#FFF9F3] shadow-[0px_6px_20px_0px_#C85A0026] flex items-center justify-center text-[#C96A1B] shrink-0">
            <LogOut size={40} strokeWidth={2} />
          </div>

          <h2 className="text-[21px] font-extrabold! text-[#1A1A1A] mt-8 tracking-tight leading-tight">
            Log out of Lain Dain?
          </h2>
          <p className="text-[14px] text-[#6B6B6B] mt-3.5 max-w-[320px] leading-relaxed">
            You'll need to sign in again to access your account. Your data will remain safe and synced.
          </p>

          {/* User profile details display card */}
          <div className="w-full bg-white border-[0.8px] border-[#EBEBEB] rounded-[20px] p-[18px] flex items-center gap-4 mt-9 text-left shadow-[0px_2px_8px_0px_#0000000D]">
            <Avatar className="w-12 h-12 select-none">
              {userProfile?.avatar ? (
                <AvatarImage src={userProfile.avatar} alt="Profile" className="object-cover" />
              ) : (
                <AvatarFallback className="bg-[linear-gradient(140deg,#0B683A_3.67%,#14A558_96.33%)] text-white font-bold text-[17px] tracking-tight">
                  {initials || 'MH'}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h4 className="text-[15.5px] font-bold text-[#1A1A1A] leading-tight">
                {displayName}
              </h4>
              <p className="text-[13px] text-[#6B6B6B] mt-1 font-medium">
                {displayPhone}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3.5 mt-8">
          {/* Yes, Log Out Button */}
          <button
            type="button"
            onClick={onConfirm}
            // box-shadow: 0px 3px 12px 0px #C85A0026;
            className="w-full h-14 bg-[#FFF3E6] border-[0.8px] border-[#C85A0033] text-tertiary rounded-[16px] font-bold text-[17px] flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer shadow-[0px_3px_12px_0px_#C85A0026]"
          >
            <LogOut size={17} strokeWidth={2.5} />
            Yes, Log Out
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full h-14 bg-white border-[1.6px] border-[#EBEBEB] text-[#6B6B6B] rounded-[16px] font-bold text-[17px] flex items-center justify-center active:scale-[0.99] transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
