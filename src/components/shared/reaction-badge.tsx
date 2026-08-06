import { useState } from 'react'
import type { ReactionEntry } from './expense-item'
import ReactionDetailsDrawer from './reaction-details-drawer'
import { haptic } from '@/lib/haptics'

interface ReactionBadgeProps {
  reactions: ReactionEntry[]
}

/** Aggregated emoji+count pills for one row's reactions — grouped by
 * emoji, insertion order preserved (first-seen emoji sorts first) so the
 * pill order doesn't jitter as counts change. Tapping a pill (or the
 * whole badge) shows who reacted, WhatsApp-style. Positioned within the
 * row's own bounds (not overflowing past it) — the row reserves extra
 * bottom padding for this when reactions are present, see expense-item.tsx. */
export default function ReactionBadge({ reactions }: ReactionBadgeProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  if (reactions.length === 0) return null

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
