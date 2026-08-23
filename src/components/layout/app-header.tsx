import { useAuthStore } from '@/store/use-auth-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Link } from '@tanstack/react-router'
import { ROUTES } from '@/constants/routes'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { useSyncStatus } from '@/hooks/use-sync-status'
import { Cloud, RefreshCw, TriangleAlert } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'

/**
 * AppHeader — shown at the top of every main app screen.
 * Contains the brand logo (Lain Dain WALLET) and the user avatar with an online status badge.
 */
export default function AppHeader() {
  const { userProfile } = useAuthStore()
  const isOnline = useNetworkStatus()
  const syncStatus = useSyncStatus()

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

      <div className="flex items-center gap-2">
        {(syncStatus.pending > 0 || syncStatus.failed > 0) && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`relative flex size-9 items-center justify-center rounded-full border bg-white shadow-sm active:scale-95 ${
                  syncStatus.failed > 0 ? 'border-tertiary/30 text-tertiary' : 'border-[#EFE7DD] text-[#A66B00]'
                }`}
                aria-label={syncStatus.failed > 0 ? 'Some changes failed to sync' : 'Changes waiting to sync'}
              >
                {syncStatus.failed > 0 ? <TriangleAlert size={17} /> : <Cloud size={17} />}
                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-foreground px-1 text-center text-[10px] font-bold leading-4 text-white tabular-nums">
                  {syncStatus.failed + syncStatus.pending}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 rounded-2xl p-4">
              <PopoverHeader>
                <PopoverTitle className="font-bold">
                  {syncStatus.failed > 0 ? 'Some changes need attention' : isOnline ? 'Syncing changes' : 'Saved on this device'}
                </PopoverTitle>
                <PopoverDescription className="leading-snug">
                  {syncStatus.failed > 0
                    ? (syncStatus.firstError ?? 'These changes could not be sent to the server.')
                    : isOnline
                      ? `${syncStatus.pending} ${syncStatus.pending === 1 ? 'change is' : 'changes are'} waiting to sync.`
                      : `${syncStatus.pending} ${syncStatus.pending === 1 ? 'change will' : 'changes will'} sync when you’re online.`}
                </PopoverDescription>
              </PopoverHeader>
              {syncStatus.failed > 0 && (
                <button
                  type="button"
                  disabled={!isOnline || syncStatus.isRetrying}
                  onClick={() => void syncStatus.retry()}
                  className="mt-1 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw size={15} className={syncStatus.isRetrying ? 'animate-spin' : undefined} />
                  {syncStatus.isRetrying ? 'Trying again…' : isOnline ? 'Try again' : 'Connect to retry'}
                </button>
              )}
            </PopoverContent>
          </Popover>
        )}

        {/* Avatar with online status badge */}
        <Link
          to={ROUTES.SETTINGS}
          className="relative cursor-pointer active:scale-95 transition-all"
          aria-label="Settings"
        >
          <Avatar className="w-11 h-11">
            {/* AvatarFallback is a sibling, not an else-branch — Radix
                shows it automatically whenever AvatarImage is absent OR
                fails to load (e.g. offline, no network to fetch the
                remote URL), instead of leaving a blank circle. */}
            {userProfile?.avatar && (
              <AvatarImage src={userProfile.avatar} alt="Profile" className="object-cover" />
            )}
            <AvatarFallback className="bg-[linear-gradient(140deg,#0B683A_3.67%,#14A558_96.33%)] shadow-[0px_2.69px_10.76px_0px_#0B683A4D] text-primary-foreground font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span
            className={`absolute right-0.5 bottom-0.5 size-2 rounded-full ring ring-white ${isOnline ? 'bg-positive' : 'bg-[#8A8A8A]'}`}
            aria-label={isOnline ? 'Online' : 'Offline'}
            title={isOnline ? 'Online' : 'Offline'}
          />
        </Link>
      </div>
    </header>
  )
}
