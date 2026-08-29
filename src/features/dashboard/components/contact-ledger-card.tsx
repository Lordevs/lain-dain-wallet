import { memo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Contact } from '@/types'
import { Status, StatusIndicator } from '@/components/kibo-ui/status'
import CompactAmount from '@/components/shared/compact-amount'

interface ContactLedgerCardProps {
  contact: Contact
  // Takes the contact rather than being pre-bound per row, so callers can
  // pass one stable useCallback-wrapped function instead of a fresh
  // closure per render — required for memo() below to actually skip
  // re-rendering rows whose contact didn't change.
  onSelect?: (contact: Contact) => void
}

/**
 * ContactLedgerCard — displays a person or group with their net balance
 * and a row of ledger name chips at the bottom.
 * Used in both Receivables and Payables lists.
 */
function ContactLedgerCard({ contact, onSelect }: ContactLedgerCardProps) {
  const { name, initials, avatarColor, avatar, ledgerCount, netAmount, currency, tags, isOnline, type } = contact

  const isReceivable = netAmount > 0
  const isSettled = netAmount === 0
  // A raw <img>, not the Radix Avatar/AvatarFallback composition used
  // elsewhere — has no built-in fallback-on-load-error, so a remote
  // avatar/group photo that can't be fetched (offline, no network) left a
  // blank circle instead of falling back to initials. Reset per contact
  // (via the key= below) so switching rows doesn't carry a stale failure.
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <div
      id={`contact-card-${contact.id}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(contact)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect?.(contact)
        }
      }}
      className="w-full shrink-0 overflow-hidden rounded-lg border-[1.08px] border-border-card bg-[linear-gradient(160deg,#FFFDF5_8.49%,#FFFFFF_58.3%)] text-left transition-all hover:shadow-md active:scale-[0.99]"
    >
      {/* Top Row */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-foreground overflow-hidden',
            avatarColor
          )}>
            {avatar && !imageFailed ? (
              <img
                key={avatar}
                src={avatar}
                alt={name}
                className="w-full h-full object-cover"
                onError={() => setImageFailed(true)}
              />
            ) : type === 'group'
              ? <span className="text-[13px] font-extrabold text-foreground">{initials}</span>
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

        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            {/* Name + ledger count */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[14px] text-foreground leading-tight">{name}</p>
            </div>

            {/* Amount + chevron */}
            <div
              className="flex items-center gap-1 shrink-0"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <span className={cn(
                'text-[15px] font-extrabold',
                isSettled ? 'text-muted-foreground' : isReceivable ? 'text-primary' : 'text-orange-payable'
              )}>
                {/* {netAmount < 0 && '-'} */}
                <CompactAmount
                  amount={Math.abs(netAmount)}
                  currency={currency ?? 'PKR'}
                  drawerTitle={`${name} Balance`}
                  className="max-w-full"
                />
              </span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </div>

          {type !== 'group' && (
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium leading-tight">
              Net across {ledgerCount} Balance{ledgerCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Ledger Tag Row */}
      {tags.length > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-x-2 gap-y-1 px-4 pb-3 border-t border-border-card pt-2.5 overflow-x-auto scrollbar-none"
        >
          {tags.map((tag, i) => (
            <span
              key={`${tag.name}-${i}`}
              className="text-[12px] font-medium whitespace-nowrap flex items-center gap-1.5"
            >
              {i > 0 && <span className="text-muted-faint/60 select-none">·</span>}
              <span className="text-foreground/70">{tag.name}</span>{' '}
              <span className={cn(
                'inline-flex items-center gap-0.5 font-bold',
                tag.amount > 0 ? 'text-primary' : 'text-orange-payable'
              )}>
                {tag.amount > 0 ? '\u002B' : ''}
                <CompactAmount
                  amount={Math.abs(tag.amount)}
                  currency={tag.currency ?? currency ?? 'PKR'}
                  drawerTitle={`${tag.name} Balance`}
                />
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default memo(ContactLedgerCard)
