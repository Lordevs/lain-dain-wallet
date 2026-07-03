import { ChevronLeft, Check } from 'lucide-react'

interface RecurringFormHeaderProps {
  title: string
  onBack: () => void
}

/** Custom centered header for the add/edit recurring payment form (back chevron + title + submit checkmark). */
export default function RecurringFormHeader({ title, onBack }: RecurringFormHeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0 relative h-14 bg-background">
      <button
        type="button"
        onClick={onBack}
        className="p-1.5 text-positive bg-transparent border-0 cursor-pointer outline-none focus:outline-none flex items-center justify-center -ml-1 shrink-0 active:scale-95"
        aria-label="Go back"
      >
        <ChevronLeft size={24} strokeWidth={2.5} />
      </button>

      <h1 className="absolute left-1/2 -translate-x-1/2 text-[19px] font-extrabold text-foreground select-none text-center leading-none">
        {title}
      </h1>

      <button
        type="submit"
        className="p-1.5 text-positive bg-transparent border-0 cursor-pointer outline-none focus:outline-none flex items-center justify-center -mr-1 shrink-0 active:scale-95"
        aria-label="Save"
      >
        <Check size={24} strokeWidth={2.5} />
      </button>
    </header>
  )
}
