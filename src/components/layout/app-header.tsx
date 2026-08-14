import { useAuthStore } from '@/store/use-auth-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
// import { Status, StatusIndicator } from '@/components/kibo-ui/status'
import { Link } from '@tanstack/react-router'
import { ROUTES } from '@/constants/routes'

/**
 * AppHeader — shown at the top of every main app screen.
 * Contains the brand logo (Lain Dain WALLET) and the user avatar with an online status badge.
 */
export default function AppHeader() {
  const { userProfile } = useAuthStore()

  // Derive initials from profile data
  const initials = (() => {
    if (!userProfile) return 'MH'
    if (userProfile.name) {
      return userProfile.name
        .split(/\s+/)
        .map((n) => n[0]?.toUpperCase() ?? '')
        .join('')
        .slice(0, 2)
    }
    const parts = [userProfile.occupation, userProfile.email]
      .filter(Boolean)
    if (parts.length === 0) return 'LD'
    return parts
      .slice(0, 2)
      .map((w) => w![0]?.toUpperCase() ?? '')
      .join('')
  })()

  return (
    <header className="flex items-center justify-between px-6 pt-4 pb-2 select-none">
      {/* Brand Logo */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-[26px] font-extrabold tracking-tight">
          <span className="text-primary">Lain</span>{" "}
          <span className="text-[#FDB105]">Dain</span>
        </span>
        {/* <span className="text-[12px] font-bold tracking-[0.2em] text-[#6B6B6B] uppercase">
          Wallet
        </span> */}
      </div>

      {/* Avatar with online status badge */}
      <Link
        to={ROUTES.SETTINGS}
        className="relative cursor-pointer active:scale-95 transition-all"
        aria-label="Settings"
      >
        <Avatar className="w-11 h-11">
          {userProfile?.avatar ? (
            <AvatarImage src={userProfile.avatar} alt="Profile" className="object-cover" />
          ) : (
            <AvatarFallback className="bg-[linear-gradient(140deg,#0B683A_3.67%,#14A558_96.33%)] shadow-[0px_2.69px_10.76px_0px_#0B683A4D] text-primary-foreground font-bold text-sm">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
        {/* Online status dot via kibo-ui Status */}
        {/* <Status
          status="degraded"
          className="absolute top-0.5 right-0.5 p-0 h-auto w-auto bg-transparent border-0 shadow-none ring-2 ring-white rounded-full"
        >
          <StatusIndicator />
        </Status> */}
      </Link>
    </header>
  )
}
