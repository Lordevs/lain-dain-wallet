import { Suspense, lazy } from 'react'
import { EmojiStyle, type EmojiClickData } from 'emoji-picker-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerClose } from '@/components/ui/drawer'
import { haptic } from '@/lib/haptics'
import { X } from 'lucide-react'

// The library itself (plus its bundled emoji data) is only needed once
// the user actually opens the "+" custom-emoji picker, so it's kept out
// of every screen's initial bundle the same way this app already
// lazy-loads other rarely-opened drawers/flows.
const EmojiPicker = lazy(() => import('emoji-picker-react'))

interface EmojiPickerDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (emoji: string) => void
  activeEmoji?: string | null
}

/** The "+" custom-emoji picker opened from ReactionPicker's quick-react
 * bar — WhatsApp-style: the fixed 6-emoji quick bar covers the common
 * case, this (a real emoji-picker-react instance, the full emoji set
 * with search + categories, rendered as native unicode glyphs) covers
 * "something else". */
export default function EmojiPickerDrawer({ isOpen, onClose, onSelect }: EmojiPickerDrawerProps) {
  const handlePick = (data: EmojiClickData) => {
    haptic.light()
    onSelect(data.emoji)
    onClose()
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white rounded-t-[32px] border-t-0 text-foreground outline-none">
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

        <div className="flex justify-center px-2 pb-4">
          {isOpen && (
            <Suspense fallback={<div className="h-[min(60vh,420px)] w-full max-w-full" />}>
              <EmojiPicker
                onEmojiClick={handlePick}
                emojiStyle={EmojiStyle.NATIVE}
                autoFocusSearch={false}
                width="100%"
                height="min(60vh, 420px)"
                previewConfig={{ showPreview: false }}
              />
            </Suspense>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
