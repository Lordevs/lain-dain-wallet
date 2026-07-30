import { useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

const PAGE_SIZE = 20

function cursorFromUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  return new URL(url).searchParams.get('cursor') ?? undefined
}

/** Every group the caller belongs to, regardless of balance — used by
 * the "Hide Ledgers" screen, which needs the full list to choose from. */
export function useGroupsQuery() {
  const query = useInfiniteQuery({
    queryKey: ['groups', 'list', 'infinite'],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const { data, error } = await apiClient.GET('/api/ledger/groups/', {
        params: { query: { page_size: PAGE_SIZE, cursor: pageParam } },
      })
      if (error) throw toApiError(error)
      return data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => cursorFromUrl(lastPage.next),
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
