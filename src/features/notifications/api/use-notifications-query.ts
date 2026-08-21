import { useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { onlineManager } from '@tanstack/react-query'
import { useAuthStore } from '@/store/use-auth-store'
import { getResourceSnapshot } from '@/lib/sqlite/resource-snapshot-store'
import type { components } from '@/lib/api/schema'

const PAGE_SIZE = 20

function cursorFromUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  return new URL(url).searchParams.get('cursor') ?? undefined
}

/** The caller's own notification feed, newest first — powers the in-app
 * notifications screen. Same rows also back the push banner and the
 * foreground toast (see apps/notifications/services.py's create_notification). */
export function useNotificationsQuery() {
  const query = useInfiniteQuery({
    queryKey: ['notifications', 'list', 'infinite'],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!onlineManager.isOnline() && ownerId) {
        const results = await getResourceSnapshot<components['schemas']['Notification']>(ownerId, 'notifications')
        return { results, next: null, previous: null }
      }
      const { data, error } = await apiClient.GET('/api/notifications/', {
        params: {
          query: {
            page_size: PAGE_SIZE,
            ...(pageParam ? { cursor: pageParam } : {}),
          },
        },
      })
      if (error) throw toApiError(error)
      return data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => cursorFromUrl(lastPage.next),
    networkMode: 'always',
  })

  return {
    ...query,
    data: query.data?.pages.flatMap((page) => page.results),
    hasNextPage: !!query.hasNextPage,
    fetchNextPage: () => {
      void query.fetchNextPage()
    },
  }
}
