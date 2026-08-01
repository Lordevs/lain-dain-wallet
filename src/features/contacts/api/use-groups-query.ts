import { useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

const PAGE_SIZE = 20

function cursorFromUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  return new URL(url).searchParams.get('cursor') ?? undefined
}

/** Every group the caller belongs to, regardless of balance — used by
 * the "Hide Ledgers" screen, which needs the full list to choose from.
 * Also backs the dashboard search overlay's "Groups" section when
 * `search` is given — filters to groups whose name matches (see
 * GroupListCreateView.get_queryset). Disabled while `search` is present
 * but empty, so opening search doesn't fetch every group up front. */
export function useGroupsQuery(search?: string) {
  const query = useInfiniteQuery({
    queryKey: ['groups', 'list', 'infinite', search ?? null],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const { data, error } = await apiClient.GET('/api/ledger/groups/', {
        params: { query: { page_size: PAGE_SIZE, cursor: pageParam, ...(search ? { search } : {}) } },
      })
      if (error) throw toApiError(error)
      return data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => cursorFromUrl(lastPage.next),
    enabled: search === undefined || search.trim().length > 0,
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
