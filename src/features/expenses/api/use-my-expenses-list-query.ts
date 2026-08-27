import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import { onlineManager } from '@tanstack/react-query'
import { useAuthStore } from '@/store/use-auth-store'
import { getLocalExpenses } from '@/lib/sqlite/expenses-store'
import type { components } from '@/lib/api/schema'

const PAGE_SIZE = 20

// `year`/`month` are real, functional query params (see apps/expenses/
// views.py's _parse_year_month) that drf-spectacular doesn't document,
// so the generated type doesn't know about them.
interface MyExpensesListQuery {
  year?: number
  month?: number
  page_size?: number
  cursor?: string
  category_id?: string
}

function cursorFromUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  return new URL(url).searchParams.get('cursor') ?? undefined
}

/** The combined "My Expenses" feed for one period — personal expenses
 * plus any friendship/group expense the caller has a split in. */
export function useMyExpensesListQuery(year?: number, month?: number, categoryId?: string) {
  const query = useInfiniteQuery({
    queryKey: ['my-expenses-list', year, month, categoryId, 'infinite'],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const ownerId = useAuthStore.getState().userProfile?.id
      if (!onlineManager.isOnline() && ownerId) {
        const rows = (await getLocalExpenses(ownerId)).filter((expense) => {
          const inPeriod = !year || !month || (Number(expense.date.slice(0, 4)) === year && Number(expense.date.slice(5, 7)) === month)
          return inPeriod && (!categoryId || expense.category.id === categoryId)
            && (expense.context === 'personal' || expense.splits.some((split) => split.id === ownerId))
        })
        const results: components['schemas']['MyExpenseItem'][] = rows.map((expense) => ({
          id: expense.id,
          context: expense.context,
          friendship: expense.friendship,
          group: expense.group ? { id: expense.group, name: 'Group' } : null,
          added_by: expense.added_by,
          description: expense.description,
          your_share: expense.context === 'personal'
            ? expense.amount
            : expense.splits.find((split) => split.id === ownerId)?.amount_owed ?? '0.00',
          currency: expense.currency,
          date: expense.date,
          category: expense.category,
          payers: expense.payers,
          created_at: expense.created_at,
        }))
        return { results, next: null, previous: null }
      }
      const requestQuery: MyExpensesListQuery = {
        page_size: PAGE_SIZE,
        ...(pageParam ? { cursor: pageParam } : {}),
        ...(year && month ? { year, month } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
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
