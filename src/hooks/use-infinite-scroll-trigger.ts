import { useEffect, useRef } from 'react'

interface UseInfiniteScrollTriggerOptions {
  onIntersect: () => void
  enabled?: boolean
  rootMargin?: string
}

/**
 * Generic "load more when this element scrolls into view" primitive, built
 * on IntersectionObserver rather than a scroll-position listener — cheaper
 * (no scroll-event throttling needed) and works regardless of which
 * ancestor actually scrolls. Attach the returned ref to a sentinel element
 * at the end of a list; `onIntersect` fires each time it becomes visible
 * while `enabled` is true (e.g. `hasNextPage && !isFetchingNextPage`).
 */
export function useInfiniteScrollTrigger({
  onIntersect,
  enabled = true,
  rootMargin = '200px',
}: UseInfiniteScrollTriggerOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  // Kept in a ref so the observer effect doesn't need to re-subscribe every
  // time the caller passes a fresh onIntersect closure — written in its own
  // effect (never during render) so React's ref rules stay happy.
  const onIntersectRef = useRef(onIntersect)
  useEffect(() => {
    onIntersectRef.current = onIntersect
  }, [onIntersect])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !enabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onIntersectRef.current()
      },
      { rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled, rootMargin])

  return sentinelRef
}
