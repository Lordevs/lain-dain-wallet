import React, { memo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface NotificationAction {
  label: string
  onClick: (e: React.MouseEvent) => void
  variant: 'green' | 'amber' | 'orange'
}

export interface NotificationCardProps {
  id: string
  tag: string
  title: string
  subtitle: string
  time?: string
  theme: 'green' | 'orange'
  icon: ReactNode
  actions?: NotificationAction[]
  onCardClick?: () => void
}

/**
 * NotificationCard — a reusable card for rendering both Recent and Action Needed notifications.
 * Features a colored tag indicator, custom colored border theme, icon badge, title/subtitle,
 * time ago badge, dynamic right chevron link, and optional primary/secondary action buttons.
 */
function NotificationCard({
  tag,
  title,
  subtitle,
  time,
  theme,
  icon,
  actions,
  onCardClick,
}: NotificationCardProps) {
  const borderClass = theme === 'green' ? 'border-primary' : 'border-tertiary'
  const tagColorClass = theme === 'green' ? 'text-positive' : 'text-[#C96A1B]'

  return (
    <div
      onClick={onCardClick}
      className={cn(
        "bg-white rounded-[18px] border-[0.8px] p-5 shadow-[0px_2px_10px_0px_#0000000D] transition-all flex flex-col text-left select-none",
        borderClass,
        onCardClick ? "cursor-pointer active:scale-[0.995]" : ""
      )}
    >
      {/* Top Content Row */}
      <div className="flex gap-4 items-start w-full">
        {/* Left Icon Badge */}
        <div className="shrink-0">
          {icon}
        </div>

        {/* Right Info Section */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 w-full">
            <span className={cn("text-[11px] font-bold tracking-tight", tagColorClass)}>
              {tag}
            </span>
            <div className="flex items-center gap-1 shrink-0 text-[#6B6B6B] text-[11px] font-normal">
              {time && <span>{time}</span>}
            </div>
          </div>

          {/* Title */}
          <h4 className="text-[15px] font-bold text-[#1A1A1A] mt-0.5 leading-snug tracking-tight">
            {title}
          </h4>

          {/* Subtitle */}
          <p className="text-[13px] text-[#6B6B6B] font-normal mt-1 leading-normal">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Optional Action Buttons */}
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-3 mt-4 w-full">
          {actions.map((action, index) => {
            const btnBg =
              action.variant === 'green'
                ? 'bg-positive text-white'
                : action.variant === 'amber'
                  ? 'bg-[#FDB105] text-[#1A1A1A]'
                  : 'bg-[#C96A1B] text-white'

            return (
              <button
                key={index}
                type="button"
                onClick={action.onClick}
                className={cn(
                  "flex-1 h-[44px] rounded-full font-bold text-[13px] border-0 cursor-pointer outline-none transition-all active:scale-[0.98] flex items-center justify-center",
                  btnBg
                )}
              >
                {action.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default memo(NotificationCard)
