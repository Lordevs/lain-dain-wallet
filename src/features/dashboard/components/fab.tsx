import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface FabProps {
  onClick?: () => void
}

/**
 * FAB (Floating Action Button) — the amber "+" button pinned bottom-right.
 * Sits above the BottomNav bar, used to add a new ledger or transaction.
 */
export default function Fab({ onClick }: FabProps) {
  return (
    <Button
      id="fab-add"
      onClick={onClick}
      aria-label="Add new"
      className="fixed bottom-[88px] right-5 z-40 w-14 h-14 rounded-full bg-secondary text-white flex items-center justify-center shadow-xs hover:bg-secondary/90 active:scale-95 transition-all p-0 shrink-0 cursor-pointer"
    >
      <Plus className="size-6! text-foreground" strokeWidth={2.5} />
    </Button>
  )
}
