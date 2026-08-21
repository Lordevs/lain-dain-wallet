import { Drawer, DrawerContent, DrawerHeader, DrawerClose } from '@/components/ui/drawer'
import { haptic } from '@/lib/haptics'
import { X } from 'lucide-react'

interface EmojiPickerDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (emoji: string) => void
  activeEmoji?: string | null
}

// A larger, hand-picked emoji set for the "+" custom-reaction picker —
// no emoji-picker library is installed in this repo, and a flat grid of
// commonly-used reaction emoji covers the WhatsApp-style "pick any
// emoji" need without pulling in a full emoji-data dependency. Kept to
// single-codepoint-ish emoji (no long ZWJ sequences) so every entry
// comfortably fits the backend's Reaction.emoji max_length=8 field.
const EMOJI_GRID = [
  '👍', '👎', '❤️', '😂', '😍', '😅', '😮', '😢',
  '😡', '🙏', '✅', '❌', '🎉', '🔥', '💯', '👏',
  '😬', '😴', '🤔', '😎', '🥳', '😱', '🤝', '💸',
  '💰', '📈', '📉', '⭐', '💡', '⚡', '👀', '🙌',
]

/** The "+" custom-emoji picker opened from ReactionPicker's quick-react
 * bar — WhatsApp-style: the fixed 6-emoji quick bar covers the common
 * case, this covers "something else". */
export default function EmojiPickerDrawer({ isOpen, onClose, onSelect, activeEmoji }: EmojiPickerDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white rounded-t-[32px] pb-8 border-t-0 text-foreground outline-none">
        <DrawerHeader className="relative flex items-center justify-center px-14 pt-4 pb-4 shrink-0 text-center">
          <h3 className="text-[17px] font-extrabold text-foreground leading-snug">Choose a reaction</h3>
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

        <div className="grid grid-cols-8 gap-1 p-4 max-h-[40vh] overflow-y-auto">
          {EMOJI_GRID.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                haptic.light()
                onSelect(emoji)
                onClose()
              }}
              className={
                'text-2xl leading-none aspect-square flex items-center justify-center rounded-xl transition-transform active:scale-90 border-0 cursor-pointer ' +
                (activeEmoji === emoji ? 'bg-foreground/15 ring-2 ring-foreground/30' : 'bg-transparent hover:bg-muted/20')
              }
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
