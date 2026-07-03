import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface SearchBarProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
}

/**
 * SearchBar — reusable search input.
 * Used on the Dashboard, Contacts, and Transactions screens.
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search ledgers, people, or groups',
  className,
  id = 'search-bar',
}: SearchBarProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <Search
        size={17}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-faint pointer-events-none z-10"
      />
      <Input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 pl-11 pr-4 rounded-full bg-white! border-[1.08px] border-border-card text-sm text-foreground placeholder:text-muted-faint outline-none focus:border-primary/40 focus-visible:border-primary/40 focus:ring-2 focus-visible:ring-2 focus-visible:ring-primary/10 focus:ring-primary/10 transition-all"
      />
    </div>
  )
}
