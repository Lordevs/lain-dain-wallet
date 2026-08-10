import React from 'react'
import { Wallet, Plus } from 'lucide-react'
import { haptic } from '@/lib/haptics'

export interface EmptyStateProps {
  /** Icon component to render inside the soft circle */
  icon?: React.ElementType
  /** Custom icon node if an icon component is not enough */
  iconElement?: React.ReactNode
  /** Custom Tailwind background & border color classes for the icon circle */
  iconBgClass?: string
  /** Custom Tailwind text/color class for the icon */
  iconColorClass?: string
  /** Main title heading */
  title: string
  /** Subtitle / description text below heading */
  description?: string
  /** Text for the optional primary action button */
  actionLabel?: string
  /** Handler invoked when the action button is clicked */
  onAction?: () => void
  /** Optional icon for the action button (defaults to Plus if actionLabel is provided) */
  actionIcon?: React.ElementType | null
  /** Optional additional outer container styles */
  className?: string
}

export default function EmptyState({
  icon: Icon = Wallet,
  iconElement,
  iconBgClass = 'bg-[#FFF9EA] border-[#FDE0A0]/60',
  iconColorClass = 'text-[#FDB105]',
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon = Plus,
  className = '',
}: EmptyStateProps) {
  const handleAction = () => {
    haptic.light()
    onAction?.()
  }

  return (
    <div
      className={`flex flex-col items-center justify-center text-center select-none py-4 px-4 ${className}`}
    >
      {/* Icon Circle */}
      <div
        className={`size-[clamp(64px,18vw,80px)] rounded-full flex items-center justify-center mb-4 border ${iconBgClass} ${iconColorClass}`}
      >
        {iconElement ? (
          iconElement
        ) : (
          <Icon className="size-[clamp(28px,8vw,34px)] shrink-0" strokeWidth={1.8} />
        )}
      </div>

      {/* Title */}
      <h3 className="text-[clamp(17px,4.8vw,21px)] font-extrabold text-[#0B683A] text-center leading-tight tracking-tight max-w-70 sm:max-w-xs mb-1.5">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-[clamp(12px,3.4vw,14px)] font-medium text-muted-foreground text-center max-w-65 sm:max-w-xs leading-snug">
          {description}
        </p>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={handleAction}
          className="mt-4 w-full h-11 bg-[#0B683A] hover:bg-[#09542f] text-white rounded-full font-bold text-[clamp(13px,3.7vw,15px)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-0 outline-none"
        >
          {ActionIcon && <ActionIcon size={18} strokeWidth={2.5} />}
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  )
}
