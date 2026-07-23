import { useInfiniteScrollTrigger } from '@/hooks/use-infinite-scroll-trigger'
import { cn } from '@/lib/utils'

interface InfiniteScrollSentinelProps {
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  className?: string
}

/**
 * Drop at the end of any paginated list to auto-fetch the next page as the
 * user scrolls near the bottom — the reusable "onscroll fetch" primitive
 * for every long list in the app (contacts, transactions, etc.), not just
 * one screen. Renders nothing once there's nothing left to fetch.
 */
export default function InfiniteScrollSentinel({
  onLoadMore,
  hasMore,
  isLoading,
  className,
}: InfiniteScrollSentinelProps) {
  const sentinelRef = useInfiniteScrollTrigger({
    onIntersect: onLoadMore,
    enabled: hasMore && !isLoading,
  })

  if (!hasMore) return null

  return (
    <div ref={sentinelRef} className={cn('py-2', className)}>
      {isLoading && <p className="text-xs text-muted-foreground text-center">Loading more...</p>}
    </div>
  )
}
