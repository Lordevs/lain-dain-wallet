import { Drawer, DrawerContent, DrawerHeader, DrawerClose } from '@/components/ui/drawer'
import ContactAvatar from '@/components/shared/contact-avatar'
import { colorForName, initialsForName } from '@/lib/avatar-visuals'
import { X } from 'lucide-react'
import type { ReactionEntry } from './expense-item'

interface ReactionDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  reactions: ReactionEntry[]
}

/** "Who reacted with what" — WhatsApp shows this on tapping a message's
 * reaction badge; same idea here, listed newest-tap-order as returned by
 * the backend rather than re-sorted. */
export default function ReactionDetailsDrawer({ isOpen, onClose, reactions }: ReactionDetailsDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white rounded-t-[32px] pb-8 border-t-0 text-foreground outline-none">
        <DrawerHeader className="relative flex items-center justify-center px-14 pt-4 pb-4 shrink-0 text-center">
          <h3 className="text-[17px] font-extrabold text-foreground leading-snug">Reactions</h3>
          <DrawerClose asChild>
            <button
              type="button"
              className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#F5F5F5] text-muted-foreground flex items-center justify-center cursor-pointer active:scale-95 transition-all outline-none border-0 shrink-0"
              aria-label="Close"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </DrawerClose>
        </DrawerHeader>
        <hr className="border-divider border-b-[0.8px] w-full shrink-0" />

        <div className="flex flex-col max-h-[50vh] overflow-y-auto">
          {reactions.map((r) => (
            <div key={r.id} className="flex items-center gap-3 py-3 px-6">
              <ContactAvatar
                initials={initialsForName(r.full_name)}
                avatarColor={colorForName(r.full_name)}
                src={r.image ?? undefined}
                size="sm"
              />
              <span className="flex-1 text-[15px] font-semibold text-foreground">{r.full_name}</span>
              <span className="text-xl leading-none">{r.emoji}</span>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
