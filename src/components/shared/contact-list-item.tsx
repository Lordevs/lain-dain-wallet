import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import ContactAvatar from './contact-avatar'

// ─── Minimal shape required by this component ─────────────────────────────────
// Kept here (not in features/contacts/types) so this shared component stays
// decoupled from any single feature's full domain type.

export interface ContactInfo {
  id: string
  name: string
  initials: string
  /** Tailwind classes e.g. "bg-[#E8F5E9] text-positive" */
  avatarColor: string
  /** Optional profile photo URL — falls back to initials when absent */
  src?: string
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContactListItemProps {
  contact: ContactInfo
  /** Secondary line — pass a ReactNode for styled text or plain string */
  subtitle?: ReactNode
  /** Slot for checkboxes, invite buttons, chevrons, etc. */
  rightSlot?: ReactNode
  onClick?: () => void
  /** Applies a soft green highlight when the item is selected */
  isHighlighted?: boolean
  avatarSize?: 'sm' | 'md' | 'lg'
  className?: string
  contactNameClassName?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ContactListItem — a single row in any contact list.
 * Composes ContactAvatar + name/subtitle + an arbitrary right slot.
 * Reusable across: choice screen, add-members picker, group-details, ledger cards.
 */
export default function ContactListItem({
  contact,
  subtitle,
  rightSlot,
  onClick,
  isHighlighted,
  avatarSize = 'md',
  className,
  contactNameClassName
}: ContactListItemProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={cn(
        'flex items-center justify-between p-4 transition-colors',
        onClick && 'cursor-pointer',
        isHighlighted
          ? 'bg-[#DCEFE4]/20'
          : onClick && 'hover:bg-muted/10',
        className,
      )}
    >
      {/* Left — Avatar + Text */}
      <div className="flex items-center gap-3 min-w-0">
        <ContactAvatar
          initials={contact.initials}
          avatarColor={contact.avatarColor}
          src={contact.src}
          size={avatarSize}
        />
        <div className="min-w-0">
          <p className={cn("font-bold text-[14px] text-foreground truncate", contactNameClassName)}>{contact.name}</p>
          {subtitle && <div className="text-xs leading-tight">{subtitle}</div>}
        </div>
      </div>

      {/* Right — arbitrary slot */}
      {rightSlot && <div className="shrink-0 ml-3">{rightSlot}</div>}
    </div>
  )
}
