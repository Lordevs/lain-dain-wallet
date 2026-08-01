import { useNavigate } from '@tanstack/react-router'
import { Search, Users, User } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { colorForName, initialsForName } from '@/lib/avatar-visuals'
import ContactAvatar from '@/components/shared/contact-avatar'
import InfiniteScrollSentinel from '@/components/shared/infinite-scroll-sentinel'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useFriendshipsQuery } from '@/features/contacts/api/use-friendships-query'
import { useGroupsQuery } from '@/features/contacts/api/use-groups-query'

interface SearchResultsOverlayProps {
  query: string
  onPersonClick: (contactId: string) => void
  onClose: () => void
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

function ResultRow({
  name,
  image,
  query,
  onClick,
}: {
  name: string
  image: string | null | undefined
  query: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-[#F2EFEA]/60 active:bg-[#EDEAE5]/60 transition-colors text-left cursor-pointer border-0 bg-transparent outline-none"
    >
      <ContactAvatar
        initials={initialsForName(name)}
        avatarColor={colorForName(name)}
        src={image ?? undefined}
        size="md"
        className="size-12 shrink-0"
      />
      <p className="flex-1 min-w-0 text-[15px] font-semibold text-[#1A1A1A] truncate leading-tight">
        {highlightMatch(name, query)}
      </p>
    </button>
  )
}

function SectionHeader({ icon: Icon, label }: { icon: typeof User; label: string }) {
  return (
    <div className="flex items-center gap-2 px-6 pt-2 pb-1.5">
      <Icon size={12} className="text-[#9A9590] shrink-0" />
      <span className="text-[11px] font-bold text-[#9A9590] tracking-[0.8px] uppercase">{label}</span>
    </div>
  )
}

function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-6 pt-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-full shrink-0" />
          <Skeleton className="h-4 w-40" />
        </div>
      ))}
    </div>
  )
}

/**
 * SearchResultsOverlay — WhatsApp-style search results panel.
 * Placed as a flex sibling below the search bar so it doesn't cover it.
 * Queries the backend directly (friendships + groups, each independently
 * cursor-paginated — see use-friendships-query.ts/use-groups-query.ts'
 * `search` param) rather than filtering an already-fetched, balance-only
 * list, so every friend/group the caller has is searchable, not just the
 * ones with a nonzero balance.
 */
export default function SearchResultsOverlay({
  query,
  onPersonClick,
  onClose,
}: SearchResultsOverlayProps) {
  const navigate = useNavigate()
  const debouncedQuery = useDebouncedValue(query.trim(), 300)

  const friendshipsQuery = useFriendshipsQuery(debouncedQuery)
  const groupsQuery = useGroupsQuery(debouncedQuery)

  const isEmptyQuery = !debouncedQuery
  const isLoading = !isEmptyQuery && (friendshipsQuery.isLoading || groupsQuery.isLoading)
  const people = friendshipsQuery.data ?? []
  const groups = groupsQuery.data ?? []
  const totalResults = people.length + groups.length

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
      ) : isLoading ? (
        <ResultsSkeleton />
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
          {people.length > 0 && (
            <div className="mt-3">
              <SectionHeader icon={User} label="People" />
              <div className="divide-y divide-[#F2EFEA]">
                {people.map((friendship) => (
                  <ResultRow
                    key={friendship.id}
                    name={friendship.friend.full_name}
                    image={friendship.friend.image}
                    query={debouncedQuery}
                    onClick={() => onPersonClick(friendship.friend.id)}
                  />
                ))}
              </div>
              <InfiniteScrollSentinel
                onLoadMore={friendshipsQuery.fetchNextPage}
                hasMore={friendshipsQuery.hasNextPage}
                isLoading={friendshipsQuery.isFetchingNextPage}
              />
            </div>
          )}

          {/* Groups Section */}
          {groups.length > 0 && (
            <div className={people.length > 0 ? 'mt-2' : 'mt-3'}>
              <SectionHeader icon={Users} label="Groups" />
              <div className="divide-y divide-[#F2EFEA]">
                {groups.map((group) => (
                  <ResultRow
                    key={group.id}
                    name={group.name}
                    image={group.image}
                    query={debouncedQuery}
                    onClick={() => {
                      onClose()
                      navigate({ to: ROUTES.GROUP_DETAILS, params: { id: group.id } })
                    }}
                  />
                ))}
              </div>
              <InfiniteScrollSentinel
                onLoadMore={groupsQuery.fetchNextPage}
                hasMore={groupsQuery.hasNextPage}
                isLoading={groupsQuery.isFetchingNextPage}
              />
            </div>
          )}

          <div className="h-10" />
        </>
      )}
    </div>
  )
}
