import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ContactLedger } from '../types'
import { Status, StatusIndicator } from '@/components/kibo-ui/status'

interface ContactLedgerCardProps {
  contact: ContactLedger
  onClick?: () => void
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

/**
 * ContactLedgerCard — displays a person or group with their net balance
 * and a row of ledger name chips at the bottom.
 * Used in both Receivables and Payables lists.
 */
export default function ContactLedgerCard({ contact, onClick }: ContactLedgerCardProps) {
  const { name, initials, avatarColor, ledgerCount, netAmount, tags, isOnline, type } = contact

  const isReceivable = netAmount > 0
  const MAX_VISIBLE_TAGS = 3


  return (
    <button
      id={`contact-card-${contact.id}`}
      onClick={onClick}
      className="w-full bg-[linear-gradient(160deg,#FFFDF5_8.49%,#FFFFFF_58.3%)] rounded-lg border-[1.08px] border-[#F3C62359] text-left overflow-hidden hover:shadow-md active:scale-[0.99] transition-all"
    >
      {/* Top Row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-foreground',
            avatarColor
          )}>
            {type === 'group'
              ? <span className="text-xl">{initials}</span>
              : <span className="text-[13px] font-extrabold text-foreground/80">{initials}</span>
            }
          </div>
          {/* Online indicator */}
          {isOnline && (
            <Status
              status="online"
              className="absolute bottom-0 right-0 p-0 h-auto w-auto bg-transparent border-0 shadow-none ring-2 ring-white rounded-full"
            >
              <StatusIndicator />
            </Status>
          )}
        </div>

        {/* Name + ledger count */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] text-foreground leading-tight">{name}</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Net across {ledgerCount} ledger{ledgerCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Amount + chevron */}
        <div className="flex items-center gap-1 shrink-0">
          <span className={cn(
            'text-[17px] font-extrabold',
            isReceivable ? 'text-primary' : 'text-[#C96A1B]'
          )}>
            Rs. {formatAmount(netAmount)}
          </span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </div>
      </div>

      {/* Ledger Tag Row */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 px-4 pb-3 border-t border-[#EFE7DD] pt-2.5 overflow-x-auto scrollbar-none">
          {tags.slice(0, MAX_VISIBLE_TAGS).map((tag, i) => (
            <span
              key={`${tag.name}-${i}`}
              className="text-[12px] font-semibold whitespace-nowrap"
            >
              <span className="text-foreground/70">{tag.name}</span>{' '}
              <span className={cn(
                'font-bold',
                tag.amount > 0 ? 'text-primary' : 'text-[#C96A1B]'
              )}>
                {tag.amount > 0 ? '+' : ''}{formatAmount(tag.amount)}
              </span>
            </span>
          ))}
          {tags.length > MAX_VISIBLE_TAGS && (
            <span className="text-[12px] text-muted-foreground font-medium whitespace-nowrap">
              ...
            </span>
          )}
        </div>
      )}
    </button>
  )
}
