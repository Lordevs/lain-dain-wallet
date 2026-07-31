import { useRef } from 'react'
import { Search, ArrowLeft, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value?: string
  onChange?: (value: string) => void
  onFocus?: () => void
  onBack?: () => void
  onClear?: () => void
  placeholder?: string
  className?: string
  id?: string
  isActive?: boolean // when true: shows back arrow + active input + clear button
}

/**
 * SearchBar — reusable search input.
 * Supports an "active" mode (isActive=true) that shows a back-arrow and clear button —
 * used on the Dashboard for the WhatsApp-style search experience.
 * Used on the Dashboard, Contacts, and Transactions screens.
 */
export default function SearchBar({
  value = '',
  onChange,
  onFocus,
  onBack,
  onClear,
  placeholder = 'Search people, or groups',
  className,
  id = 'search-bar',
  isActive = false,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  if (isActive) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-[#F2EFEA] flex items-center justify-center shrink-0 border-0 outline-none cursor-pointer transition-colors hover:bg-[#E8E4DF] active:bg-[#DEDAD5]"
        >
          <ArrowLeft size={18} className="text-[#1A1A1A]" />
        </button>

        {/* Active input */}
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9590] pointer-events-none z-10"
          />
          <input
            ref={inputRef}
            id={id}
            autoFocus
            type="search"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full h-11 pl-10 pr-10 rounded-full bg-white border border-[#EBEBEB] text-[14px] text-[#1A1A1A] placeholder:text-[#9A9590] outline-none focus:border-positive/40 focus:ring-2 focus:ring-positive/10 transition-all [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          />
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onChange?.('')
                onClear?.()
                inputRef.current?.focus()
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#9A9590] flex items-center justify-center border-0 outline-none cursor-pointer"
            >
              <X size={11} className="text-white" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Passive / default mode
  return (
    <div className={cn('relative w-full', className)}>
      <Search
        size={17}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-faint pointer-events-none z-10"
      />
      <input
        ref={inputRef}
        id={id}
        type="search"
        readOnly={!!onFocus}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className={cn(
          "w-full h-12 pl-11 rounded-full bg-white border-[1.08px] border-border-card text-sm text-foreground placeholder:text-muted-faint outline-none focus:border-primary/40 focus-visible:border-primary/40 focus:ring-2 focus-visible:ring-2 focus-visible:ring-primary/10 focus:ring-primary/10 transition-all cursor-pointer [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
          value.length > 0 ? "pr-10" : "pr-4"
        )}
      />
      {value.length > 0 && !onFocus && (
        <button
          type="button"
          onClick={() => {
            onChange?.('')
            onClear?.()
            inputRef.current?.focus()
          }}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#F2EFEA] hover:bg-[#E8E4DF] flex items-center justify-center border-0 outline-none cursor-pointer transition-colors"
        >
          <X size={11} className="text-[#1A1A1A]" strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}
