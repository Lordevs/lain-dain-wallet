import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'

// ─── Props ────────────────────────────────────────────────────────────────────

interface FlowHeaderProps {
  /** Page title */
  title: string
  /** Subtitle text displayed below the title */
  subtitle?: string
  /** Called when the back-chevron button is tapped. Defaults to window.history.back() */
  onBack?: () => void
  /** Back button style variant: 'circle' (default circular button) or 'minimal' (just the chevron arrow) */
  backVariant?: 'circle' | 'minimal'
  /** Optional avatar component (renders between back button and text) */
  avatar?: ReactNode
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
  rightSlot,
}: FlowHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }
    // window.history.length is always ≥ 2 in a Capacitor WebView (the WebView
    // pre-populates the stack with a blank entry before the app loads), so
    // checking it is an unreliable guard. Every screen in this app is reached
    // via in-app navigation, so history.back() is always safe to call.
    window.history.back()
  }

  // Check if subtitle contains "selected" to style it green
  const isSelectedSubtitle = subtitle?.toLowerCase().includes('selected')

  return (
    <header className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
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

        {/* Optional Avatar */}
        {avatar && <div className="shrink-0 flex items-center">{avatar}</div>}

        {/* Title & Subtitle */}
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

      {/* Right Slot */}
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </header>
  )
}

