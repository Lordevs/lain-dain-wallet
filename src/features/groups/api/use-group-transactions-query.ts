import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

export type GroupTransaction =
  | { kind: 'expense'; date: string; data: components['schemas']['ExpenseRead'] }
  | { kind: 'settlement'; date: string; data: components['schemas']['SettlementRead'] }

export type GroupSortBy = 'newest' | 'oldest' | 'highest' | 'lowest'
/** 'all' merges both sources; 'payment' is settlements-only (they have no
 * real Category); any other string is a Category id (expenses-only). */
export type GroupTransactionFilter = 'all' | 'payment' | string

const PAGE_SIZE = 20

interface TransactionSource {
  /** `undefined` = first page still pending; a string = next page; `null`
   * = exhausted (also used to mark a source as disabled entirely under a
   * filter that can't match it — see initialPageParam). */
  cursor?: string | null
  buffer: GroupTransaction[]
}

interface TransactionsPageParam {
  expenses: TransactionSource
  settlements: TransactionSource
}

interface TransactionsPage {
  items: GroupTransaction[]
  nextPageParam?: TransactionsPageParam
}

/** Seeds whichever source the current filter can't match as already
 * "exhausted" (cursor: null) — the merge loop below then naturally drains
 * only the active source(s), no separate single-source code path needed. */
function initialPageParam(filter: GroupTransactionFilter): TransactionsPageParam {
  return {
    expenses: { buffer: [], cursor: filter === 'payment' ? null : undefined },
    settlements: { buffer: [], cursor: filter === 'all' ? undefined : null },
  }
}

function cursorFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return new URL(url).searchParams.get('cursor')
}

/** Matches each pagination class's own `get_ordering()` (apps/expenses/
 * views.py) for the given sort, so the merge never disagrees with what
 * the backend actually returned. */
function makeComparator(sort: GroupSortBy) {
  const ascending = sort === 'oldest' || sort === 'lowest'
  const byAmount = sort === 'highest' || sort === 'lowest'

  return (a: GroupTransaction, b: GroupTransaction): number => {
    const av = byAmount ? Number(a.data.amount) : a.date
    const bv = byAmount ? Number(b.data.amount) : b.date
    const primary = ascending ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0)
    if (primary !== 0) return primary

    const byId = ascending ? a.data.id.localeCompare(b.data.id) : b.data.id.localeCompare(a.data.id)
    if (byId !== 0) return byId

    return ascending ? a.kind.localeCompare(b.kind) : b.kind.localeCompare(a.kind)
  }
}

async function fetchExpenses(
  groupId: string,
  cursor: string | undefined,
  sort: GroupSortBy,
  categoryId: string | undefined,
): Promise<{ items: GroupTransaction[]; nextCursor: string | null }> {
  const { data, error } = await apiClient.GET('/api/expenses/groups/{group_id}/', {
    params: {
      path: { group_id: groupId },
      query: { page_size: PAGE_SIZE, cursor, sort, ...(categoryId ? { category_id: categoryId } : {}) },
    },
  })
  if (error) throw toApiError(error)

  return {
    items: data.results.map((expense) => ({ kind: 'expense', date: expense.date, data: expense })),
    nextCursor: cursorFromUrl(data.next),
  }
}

async function fetchSettlements(
  groupId: string,
  cursor: string | undefined,
  sort: GroupSortBy,
): Promise<{ items: GroupTransaction[]; nextCursor: string | null }> {
  const { data, error } = await apiClient.GET('/api/expenses/groups/{group_id}/settlements/', {
    params: {
      path: { group_id: groupId },
      query: { page_size: PAGE_SIZE, cursor, sort },
    },
  })
  if (error) throw toApiError(error)

  return {
    items: data.results.map((settlement) => ({
      kind: 'settlement',
      date: settlement.date,
      data: settlement,
    })),
    nextCursor: cursorFromUrl(data.next),
  }
}

async function refillEmptySources(
  groupId: string,
  expenses: TransactionSource,
  settlements: TransactionSource,
  sort: GroupSortBy,
  categoryId: string | undefined,
) {
  const shouldFetchExpenses = expenses.buffer.length === 0 && expenses.cursor !== null
  const shouldFetchSettlements = settlements.buffer.length === 0 && settlements.cursor !== null

  const [expensePage, settlementPage] = await Promise.all([
    shouldFetchExpenses ? fetchExpenses(groupId, expenses.cursor ?? undefined, sort, categoryId) : undefined,
    shouldFetchSettlements ? fetchSettlements(groupId, settlements.cursor ?? undefined, sort) : undefined,
  ])

  if (expensePage) {
    expenses.buffer.push(...expensePage.items)
    expenses.cursor = expensePage.nextCursor
  }
  if (settlementPage) {
    settlements.buffer.push(...settlementPage.items)
    settlements.cursor = settlementPage.nextCursor
  }
}

async function fetchPage(
  groupId: string,
  pageParam: TransactionsPageParam,
  sort: GroupSortBy,
  categoryId: string | undefined,
): Promise<TransactionsPage> {
  const expenses: TransactionSource = {
    cursor: pageParam.expenses.cursor,
    buffer: [...pageParam.expenses.buffer],
  }
  const settlements: TransactionSource = {
    cursor: pageParam.settlements.cursor,
    buffer: [...pageParam.settlements.buffer],
  }
  const items: GroupTransaction[] = []
  const compare = makeComparator(sort)

  while (items.length < PAGE_SIZE) {
    const needsRefill =
      (expenses.buffer.length === 0 && expenses.cursor !== null)
      || (settlements.buffer.length === 0 && settlements.cursor !== null)
    if (needsRefill) {
      await refillEmptySources(groupId, expenses, settlements, sort, categoryId)
    }

    const nextExpense = expenses.buffer[0]
    const nextSettlement = settlements.buffer[0]
    if (!nextExpense && !nextSettlement) break

    if (!nextSettlement || (nextExpense && compare(nextExpense, nextSettlement) <= 0)) {
      items.push(expenses.buffer.shift()!)
    } else {
      items.push(settlements.buffer.shift()!)
    }
  }

  const hasMore =
    expenses.buffer.length > 0
    || settlements.buffer.length > 0
    || expenses.cursor !== null
    || settlements.cursor !== null

  return {
    items,
    nextPageParam: hasMore ? { expenses, settlements } : undefined,
  }
}

/** Mirrors useFriendshipTransactionsQuery — merges this group's expenses
 * and settlements into one infinitely-scrollable timeline using a
 * buffered two-cursor merge, so loaded rows never reorder. `sort` and
 * `filter` are both real backend query params (see apps/expenses/
 * views.py's per-source `get_ordering()` and GroupExpenseListCreateView's
 * `category_id` filter) — changing either restarts pagination from
 * scratch via the query key, never carries a cursor across. */
export function useGroupTransactionsQuery(
  groupId: string | undefined,
  sort: GroupSortBy = 'newest',
  filter: GroupTransactionFilter = 'all',
) {
  const categoryId = filter !== 'all' && filter !== 'payment' ? filter : undefined

  const query = useInfiniteQuery({
    // Keep the existing prefix so mutation invalidations still match, while
    // preventing persisted data from the previous non-infinite query shape
    // from being read as InfiniteData.
    queryKey: ['group-transactions', groupId, sort, filter, 'infinite-v2'],
    queryFn: ({ pageParam }: { pageParam: TransactionsPageParam }) =>
      fetchPage(groupId!, pageParam, sort, categoryId),
    initialPageParam: initialPageParam(filter),
    getNextPageParam: (lastPage) => lastPage.nextPageParam,
    enabled: !!groupId,
  })

  const data = useMemo(
    () => query.data?.pages.flatMap((page) => page.items),
    [query.data],
  )

  return {
    ...query,
    data,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: !!query.hasNextPage,
    fetchNextPage: () => {
      void query.fetchNextPage()
    },
  }
}
