import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useHierarchyBack } from '@/hooks/use-hierarchy-back'

// ─── Props ────────────────────────────────────────────────────────────────────

interface FlowHeaderProps {
  /** Page title */
  title: string
  /** Subtitle text displayed below the title */
  subtitle?: string
  /** Optional flow-specific back action; otherwise the route hierarchy is used. */
  onBack?: () => void
  /** Back button style variant: 'circle' (default circular button) or 'minimal' (just the chevron arrow) */
  backVariant?: 'circle' | 'minimal'
  /** Optional avatar component (renders between back button and text) */
  avatar?: ReactNode
  /** Makes the avatar/title block an accessible navigation target. */
  onTitleClick?: () => void
  /** Optional element rendered on the right side */
  rightSlot?: ReactNode
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * FlowHeader — unified top bar pattern shared by main screens, detail views, and sub-flows.
 * Left: circular back button (circle) or simple back chevron (minimal).
 * Centre: title, subtitle, and optional avatar.
 * Right: optional action slot (dropdown, menu, etc.).
 */
export default function FlowHeader({
  title,
  subtitle,
  onBack,
  backVariant = 'circle',
  avatar,
  onTitleClick,
  rightSlot,
}: FlowHeaderProps) {
  const hierarchyBack = useHierarchyBack()
  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }
    hierarchyBack()
  }

  // Check if subtitle contains "selected" to style it green
  const isSelectedSubtitle = subtitle?.toLowerCase().includes('selected')

  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between bg-background px-6 pb-3 pt-5">
      {/* Left side actions and details */}
      <div className="flex items-center gap-3">
        {/* Back Button */}
        {backVariant === 'circle' ? (
          <button
            type="button"
            onClick={handleBack}
            className="size-10 rounded-full border-[0.8px] border-divider bg-white shadow-[0px_1px_4px_#0000000F] flex items-center justify-center text-foreground transition-all cursor-pointer outline-none shrink-0"
            aria-label="Go back"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center p-2 text-foreground cursor-pointer bg-transparent border-0 outline-none -ml-2 shrink-0"
            aria-label="Go back"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
        )}

        {/* Title area can act as a profile/settings link on detail screens. */}
        <div
          role={onTitleClick ? 'button' : undefined}
          tabIndex={onTitleClick ? 0 : undefined}
          onClick={onTitleClick}
          onKeyDown={(event) => {
            if (onTitleClick && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault()
              onTitleClick()
            }
          }}
          className={`flex items-center gap-3 ${onTitleClick ? 'cursor-pointer outline-none' : ''}`}
        >
          {avatar && <div className="shrink-0 flex items-center">{avatar}</div>}
          <div className="flex flex-col text-left">
          <h1 className="text-lg font-bold! text-foreground leading-tight select-none">
            {title}
          </h1>
          {subtitle && (
            <span
              className={`text-xs mt-0.5 font-bold leading-none ${isSelectedSubtitle ? 'text-positive' : 'text-muted-foreground'
                }`}
            >
              {subtitle}
            </span>
          )}
          </div>
        </div>
      </div>

      {/* Right Slot */}
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </header>
  )
}
