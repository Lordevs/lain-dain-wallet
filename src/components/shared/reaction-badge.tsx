import { useState } from 'react'
import { Smile } from 'lucide-react'
import type { ReactionEntry } from './expense-item'
import ReactionDetailsDrawer from './reaction-details-drawer'
import { haptic } from '@/lib/haptics'

interface ReactionBadgeProps {
  reactions: ReactionEntry[]
  /** Opens the same ReactionPicker a long-press does — used by the
   * default neutral-face icon shown when there are no reactions yet. */
  onOpenPicker: () => void
}

/** Aggregated emoji+count pills for one row's reactions — grouped by
 * emoji, insertion order preserved (first-seen emoji sorts first) so the
 * pill order doesn't jitter as counts change. Tapping a pill (or the
 * whole badge) shows who reacted, WhatsApp-style. When there are no
 * reactions yet, shows a plain neutral face instead — tapping IT opens
 * the reaction picker directly, the same one a long-press opens, so
 * reacting doesn't require discovering the long-press gesture first.
 * Positioned within the row's own bounds (not overflowing past it) — the
 * row reserves extra bottom padding for this, see expense-item.tsx. */
export default function ReactionBadge({ reactions, onOpenPicker }: ReactionBadgeProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  if (reactions.length === 0) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          haptic.light()
          onOpenPicker()
        }}
        className="absolute bottom-1.5 left-12 flex items-center justify-center size-6 rounded-full bg-white border-[0.8px] border-divider text-muted-foreground shadow-sm cursor-pointer active:scale-90 transition-transform"
        aria-label="Add a reaction"
      >
        <Smile size={14} strokeWidth={2} />
      </button>
    )
  }

  const counts = new Map<string, number>()
  for (const r of reactions) counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1)

  return (
    <>
      <div
        className="absolute bottom-1.5 left-12 flex gap-1"
        onClick={(e) => {
          e.stopPropagation()
          haptic.light()
          setDetailsOpen(true)
        }}
      >
        {[...counts.entries()].map(([emoji, count]) => (
          <span
            key={emoji}
            className="flex items-center gap-0.5 bg-white border-[0.8px] border-divider rounded-full px-1.5 py-0.5 text-[11px] shadow-sm cursor-pointer active:scale-95 transition-transform"
          >
            <span className="text-xs leading-none">{emoji}</span>
            {count > 1 && <span className="text-muted-foreground font-medium leading-none">{count}</span>}
          </span>
        ))}
      </div>
      {/* Drawer is portaled to document.body, but React still bubbles its
          click events up the *component* tree (Drawer -> ReactionBadge ->
          ExpenseItem's row), not the DOM tree — without this, closing the
          drawer (close button or tap-outside) re-fires the row's onClick
          and opens the expense detail screen underneath. */}
      <div onClick={(e) => e.stopPropagation()}>
        <ReactionDetailsDrawer
          isOpen={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          reactions={reactions}
        />
      </div>
    </>
  )
}
