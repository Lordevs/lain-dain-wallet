import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'

const PAGE_SIZE = 20

// `year`/`month` are real, functional query params (see apps/expenses/
// views.py's _parse_year_month) that drf-spectacular doesn't document,
// so the generated type doesn't know about them.
interface MyExpensesListQuery {
  year?: number
  month?: number
  page_size?: number
  cursor?: string
}

function cursorFromUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  return new URL(url).searchParams.get('cursor') ?? undefined
}

/** The combined "My Expenses" feed for one period — personal expenses
 * plus any friendship/group expense the caller has a split in. */
export function useMyExpensesListQuery(year?: number, month?: number) {
  const query = useInfiniteQuery({
    queryKey: ['my-expenses-list', year, month, 'infinite'],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const requestQuery: MyExpensesListQuery = {
        page_size: PAGE_SIZE,
        ...(pageParam ? { cursor: pageParam } : {}),
        ...(year && month ? { year, month } : {}),
      }
      const { data, error } = await apiClient.GET('/api/expenses/my-expenses/', {
        params: { query: requestQuery as Record<string, never> },
      })
      if (error) throw toApiError(error)
      return data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => cursorFromUrl(lastPage.next),
    // Switching month/year changes the query key entirely — without this,
    // that swap flashes a full loading skeleton instead of keeping last
    // period's rows on screen until the new period's first page lands.
    placeholderData: keepPreviousData,
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
