import { cn } from '@/lib/utils'
import { User } from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'

// ─── Size Map ─────────────────────────────────────────────────────────────────

const SIZE_CLASSES = {
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-14 text-base',
} as const

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContactAvatarProps {
  /** Two-letter (or single-letter) initials shown when no image is available */
  initials: string
  /**
   * Tailwind classes for the fallback background & text color.
   * e.g. "bg-[#E8F5E9] text-positive"
   */
  avatarColor: string
  /** URL to the contact's profile photo (optional) */
  src?: string
  size?: keyof typeof SIZE_CLASSES
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ContactAvatar — reusable avatar that shows a photo when available,
 * falling back to a colored user silhouette.
 *
 * Built on shadcn Avatar (Radix AvatarPrimitive) so it handles
 * image loading states automatically.
 *
 * Used in: contact lists, selected-member strips, ledger cards, success screens.
 */
export default function ContactAvatar({
  initials,
  avatarColor,
  src,
  size = 'md',
  className,
}: ContactAvatarProps) {
  return (
    <Avatar
      className={cn(
        'shrink-0 rounded-full after:hidden',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {src && <AvatarImage src={src} alt={initials} className="object-cover" />}
      <AvatarFallback
        className={cn(
          'rounded-full select-none border-0 flex items-center justify-center',
          avatarColor,
        )}
      >
        <User className="size-[80%] fill-current" />
      </AvatarFallback>
    </Avatar>
  )
}
