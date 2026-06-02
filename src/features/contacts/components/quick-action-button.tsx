import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QuickActionButtonProps {
  title: string
  description: string
  icon: ReactNode
  onClick?: () => void
  className?: string
}

/**
 * QuickActionButton — A reusable full-width action button.
 * Commonly used at the top of flow/list pages (e.g. "New Group", "New Contact").
 * Features a modern gradient icon wrapper, bold title, and description.
 */
export default function QuickActionButton({
  title,
  description,
  icon,
  onClick,
  className,
}: QuickActionButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        'w-full h-auto flex items-center justify-between p-4 text-left rounded-none hover:bg-muted/10 active:bg-[#FEFAF1] transition-colors',
        className,
      )}
    >
      <div className="flex items-center gap-4">
        {/* Gradient Icon Container */}
        <div
          className="w-12 h-12 rounded-full text-white flex items-center justify-center shrink-0 bg-[linear-gradient(230deg,#0B683A_54.37%,#14A558_89.86%)] shadow-[0px_4px_19px_0px_rgba(11,104,58,0.35)]"
        >
          {icon}
        </div>
        <div className="text-left font-sans">
          <h3 className="font-bold text-lg text-foreground leading-tight">{title}</h3>
          <p className="text-xs text-muted-foreground font-medium">{description}</p>
        </div>
      </div>
      <ChevronLeft size={16} className="rotate-180 text-[#C5C0B8] shrink-0" />
    </Button>
  )
}
