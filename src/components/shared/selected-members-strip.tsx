import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import ContactAvatar from './contact-avatar'
import type { ContactInfo } from './contact-list-item'

// ─── Props ────────────────────────────────────────────────────────────────────

interface SelectedMembersStripProps {
  members: ContactInfo[]
  /** Called when the × badge is tapped. Omit to hide the badge (read-only). */
  onRemove?: (id: string) => void
  /** Optional slot rendered after all member chips (e.g. an "Add" button) */
  appendSlot?: ReactNode
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SelectedMembersStrip — horizontally scrollable row of selected member chips.
 * Each chip shows an avatar + first name, with an optional ×-remove badge.
 * Used in: AddMembersStep, GroupDetailsStep, and any future multi-select picker.
 *
 * Returns null when the members array is empty (no-op render).
 */
export default function SelectedMembersStrip({
  members,
  onRemove,
  appendSlot,
  className,
}: SelectedMembersStripProps) {
  if (members.length === 0 && !appendSlot) return null

  return (
    <div
      className={cn(
        'flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none',
        className,
      )}
    >
      {members.map((contact) => (
        <div
          key={contact.id}
          className="relative flex flex-col items-center shrink-0"
        >
          <div className="relative">
            <div className="p-0.5 rounded-full border-[2.2px] border-primary bg-[#FEFAF1]">
              <ContactAvatar
                initials={contact.initials}
                avatarColor={contact.avatarColor}
                src={contact.src}
                size="md"
              />
            </div>
            {onRemove && (
              <Button
                type="button"
                size="icon"
                onClick={() => onRemove(contact.id)}
                aria-label={`Remove ${contact.name}`}
                className="absolute bottom-0 right-0 size-4 rounded-full bg-[#EF4444] hover:bg-[#EF4444]/90 text-white shrink-0 shadow-sm border-[1.5px] border-[#FEFAF1] flex items-center justify-center"
              >
                <X className="size-2.5" />
              </Button>
            )}
          </div>
          <span className="text-[12px] font-medium text-foreground mt-1 max-w-[48px] truncate text-center">
            {contact.name.split(' ')[0]}
          </span>
        </div>
      ))}

      {appendSlot}
    </div>
  )
}
