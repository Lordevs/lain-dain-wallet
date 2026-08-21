import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { haptic } from '@/lib/haptics'
import EmojiPickerDrawer from './emoji-picker-drawer'

const REACTION_EMOJIS = ['👍', '✅', '🙏', '😅', '❤️', '😬'] as const

interface ReactionPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (emoji: string) => void
  activeEmoji?: string | null
  children: React.ReactNode
}

/** WhatsApp-style quick-emoji bar, floating next to whatever it's
 * anchored to (a long-pressed row) rather than taking over the screen
 * like this app's usual vaul bottom sheets. The trailing "+" opens a
 * full emoji grid (EmojiPickerDrawer) for anything outside this fixed
 * 6-emoji quick set. */
export default function ReactionPicker({ open, onOpenChange, onSelect, activeEmoji, children }: ReactionPickerProps) {
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverAnchor asChild>{children}</PopoverAnchor>
        <PopoverContent
          side="top"
          align="center"
          sideOffset={8}
          collisionPadding={12}
          className="w-auto flex-row gap-1 p-1.5 rounded-full"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                haptic.light()
                onSelect(emoji)
                onOpenChange(false)
              }}
              className={
                'text-2xl leading-none p-1.5 rounded-full transition-transform active:scale-90 border-0 cursor-pointer ' +
                (activeEmoji === emoji ? 'bg-foreground/15 ring-2 ring-foreground/30 scale-110' : 'bg-transparent hover:bg-muted/20')
              }
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              haptic.light()
              onOpenChange(false)
              setShowMore(true)
            }}
            className="flex items-center justify-center leading-none p-1.5 size-9 rounded-full transition-transform active:scale-90 border-0 cursor-pointer bg-muted/10 hover:bg-muted/20 text-muted-foreground"
            aria-label="Choose another emoji"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </PopoverContent>
      </Popover>

      <EmojiPickerDrawer
        isOpen={showMore}
        onClose={() => setShowMore(false)}
        activeEmoji={activeEmoji}
        onSelect={onSelect}
      />
    </>
  )
}
