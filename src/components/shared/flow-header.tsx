import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Props ────────────────────────────────────────────────────────────────────

interface FlowHeaderProps {
  /** Page title displayed in the centre */
  title: string
  /** Subtitle text displayed below the title */
  subtitle?: string
  /** Called when the back-chevron button is tapped */
  onBack: () => void
  /**
   * Optional element rendered on the right side.
   * When omitted a blank spacer is used to keep the title centred.
   */
  rightSlot?: ReactNode
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * FlowHeader — the top bar pattern shared by every step in a multi-step flow.
 * Left: circular back button (shadcn Button). Centre: title. Right: optional slot or spacer.
 */
export default function FlowHeader({ title, subtitle, onBack, rightSlot }: FlowHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 pt-5 pb-3">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onBack}
          aria-label="Go back"
          className="size-10 border-0 rounded-full bg-[#0000000A]! text-foreground shrink-0"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </Button>

        {/* Title & Subtitle */}
        <div className="flex flex-col text-left">
          <h1 className="text-lg font-bold text-foreground leading-tight">{title}</h1>
          {subtitle && (
            <span className="text-xs text-muted-foreground font-medium mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right slot or blank spacer to keep title centred */}
      {rightSlot ? (
        <div className="shrink-0">{rightSlot}</div>
      ) : (
        <div className="size-10 shrink-0" aria-hidden />
      )}
    </header>
  )
}
