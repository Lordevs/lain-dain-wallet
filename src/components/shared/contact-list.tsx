import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContactListProps {
  /** Section label rendered above the card */
  title?: string
  /** 'primary' = green label (On Lain Dain), 'muted' = grey label (Invite) */
  titleColor?: 'primary' | 'muted'
  children: ReactNode
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ContactList — the white rounded card that wraps a set of ContactListItems.
 * Handles the outer border, shadow, and divide lines between rows.
 * Accepts an optional section title above it.
 */
export default function ContactList({
  title,
  titleColor = 'primary',
  children,
  className,
}: ContactListProps) {
  return (
    <div className={className}>
      {title && (
        <h2
          className={cn(
            'text-xs font-bold uppercase tracking-wider mb-3',
            titleColor === 'primary' ? 'text-primary' : 'text-[#6B6B6B]',
          )}
        >
          {title}
        </h2>
      )}
      <div className="bg-white border border-[#EFE7DD] rounded-xl divide-y divide-[#EFE7DD] overflow-hidden">
        {children}
      </div>
    </div>
  )
}
