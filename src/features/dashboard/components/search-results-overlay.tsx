import { useNavigate } from '@tanstack/react-router'
import { Search, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Contact } from '@/types'
import { ROUTES } from '@/constants/routes'

interface SearchResultsOverlayProps {
  query: string
  contacts: Contact[]
  onPersonClick: (contactId: string) => void
  onClose: () => void
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return <span>{text}</span>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <span>{text}</span>
  return (
    <span>
      {text.slice(0, idx)}
      <span className="text-positive font-extrabold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </span>
  )
}

function SearchResultRow({
  contact,
  query,
  onClick,
}: {
  contact: Contact
  query: string
  onClick: () => void
}) {
  const isReceivable = contact.netAmount >= 0

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-[#F2EFEA]/60 active:bg-[#EDEAE5]/60 transition-colors text-left cursor-pointer border-0 bg-transparent outline-none"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center font-bold',
          contact.avatarColor
        )}>
          {contact.type === 'group'
            ? <span className="text-xl">{contact.initials}</span>
            : <span className="text-[12px] font-extrabold text-foreground/80">{contact.initials}</span>
          }
        </div>
        {contact.isOnline && (
          <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#FEFAF1]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-[#1A1A1A] truncate leading-tight">
          {highlightMatch(contact.name, query)}
        </p>
        <p className="text-[12px] text-[#9A9590] font-normal mt-0.5 truncate">
          {contact.type === 'group'
            ? `${contact.ledgerCount} shared expense${contact.ledgerCount !== 1 ? 's' : ''}`
            : `${contact.ledgerCount} ledger${contact.ledgerCount !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {/* Amount */}
      {contact.netAmount !== 0 && (
        <span className={cn(
          'text-[13px] font-bold shrink-0',
          isReceivable ? 'text-positive' : 'text-[#C96A1B]'
        )}>
          {isReceivable ? '+' : '-'} Rs. {formatAmount(contact.netAmount)}
        </span>
      )}
    </button>
  )
}

/**
 * SearchResultsOverlay — WhatsApp-style search results panel.
 * Placed as a flex sibling below the search bar so it doesn't cover it.
 */
export default function SearchResultsOverlay({
  query,
  contacts,
  onPersonClick,
  onClose,
}: SearchResultsOverlayProps) {
  const navigate = useNavigate()
  const q = query.trim().toLowerCase()

  const matchingPeople = contacts.filter(
    (c) => c.type === 'person' && c.name.toLowerCase().includes(q)
  )
  const matchingGroups = contacts.filter(
    (c) => c.type === 'group' && c.name.toLowerCase().includes(q)
  )

  const totalResults = matchingPeople.length + matchingGroups.length
  const isEmptyQuery = !query.trim()

  return (
    <div className="flex-1 overflow-y-auto bg-[#FEFAF1]">
      {isEmptyQuery ? (
        /* Prompt state — nothing typed yet */
        <div className="flex flex-col items-center justify-center pt-20 gap-3 text-center px-8">
          <div className="w-14 h-14 rounded-full bg-[#F2EFEA] flex items-center justify-center">
            <Search size={24} className="text-[#9A9590]" />
          </div>
          <p className="text-[14px] font-semibold text-[#6B6B6B]">Search people or groups</p>
        </div>
      ) : totalResults === 0 ? (
        /* No match state */
        <div className="flex flex-col items-center justify-center pt-20 gap-3 text-center px-8">
          <div className="w-14 h-14 rounded-full bg-[#F2EFEA] flex items-center justify-center">
            <Search size={24} className="text-[#9A9590]" />
          </div>
          <p className="text-[15px] font-semibold text-[#1A1A1A]">No results for "{query}"</p>
          <p className="text-[13px] text-[#9A9590] font-normal leading-relaxed">
            Try a different name or check the spelling.
          </p>
        </div>
      ) : (
        <>
          {/* People Section */}
          {matchingPeople.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2 px-6 pt-2 pb-1.5">
                <User size={12} className="text-[#9A9590] shrink-0" />
                <span className="text-[11px] font-bold text-[#9A9590] tracking-[0.8px] uppercase">
                  People
                </span>
              </div>
              <div className="divide-y divide-[#F2EFEA]">
                {matchingPeople.map((contact) => (
                  <SearchResultRow
                    key={contact.id}
                    contact={contact}
                    query={query}
                    onClick={() => onPersonClick(contact.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Groups Section */}
          {matchingGroups.length > 0 && (
            <div className={matchingPeople.length > 0 ? 'mt-2' : 'mt-3'}>
              <div className="flex items-center gap-2 px-6 pt-2 pb-1.5">
                <Users size={12} className="text-[#9A9590] shrink-0" />
                <span className="text-[11px] font-bold text-[#9A9590] tracking-[0.8px] uppercase">
                  Groups
                </span>
              </div>
              <div className="divide-y divide-[#F2EFEA]">
                {matchingGroups.map((contact) => (
                  <SearchResultRow
                    key={contact.id}
                    contact={contact}
                    query={query}
                    onClick={() => {
                      onClose();
                      (navigate as any)({
                        to: ROUTES.GROUP_DETAILS,
                        params: { id: contact.id },
                      })
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="h-10" />
        </>
      )}
    </div>
  )
}
