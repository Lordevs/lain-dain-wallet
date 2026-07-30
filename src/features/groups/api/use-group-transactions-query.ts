import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'

export type GroupTransaction =
  | { kind: 'expense'; date: string; data: components['schemas']['ExpenseRead'] }
  | { kind: 'settlement'; date: string; data: components['schemas']['SettlementRead'] }

const PAGE_SIZE = 20

interface TransactionSource {
  /** `undefined` = first page; a string = next page; `null` = exhausted. */
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

const INITIAL_PAGE_PARAM: TransactionsPageParam = {
  expenses: { buffer: [] },
  settlements: { buffer: [] },
}

function cursorFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return new URL(url).searchParams.get('cursor')
}

function compareTransactions(a: GroupTransaction, b: GroupTransaction): number {
  const byDate = b.date.localeCompare(a.date)
  if (byDate !== 0) return byDate

  // Match both backend cursors' exact secondary ordering: ("-date", "-id").
  const byId = b.data.id.localeCompare(a.data.id)
  if (byId !== 0) return byId

  return b.kind.localeCompare(a.kind)
}

async function fetchExpenses(
  groupId: string,
  cursor: string | undefined,
): Promise<{ items: GroupTransaction[]; nextCursor: string | null }> {
  const { data, error } = await apiClient.GET('/api/expenses/groups/{group_id}/', {
    params: {
      path: { group_id: groupId },
      query: { page_size: PAGE_SIZE, cursor },
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
): Promise<{ items: GroupTransaction[]; nextCursor: string | null }> {
  const { data, error } = await apiClient.GET('/api/expenses/groups/{group_id}/settlements/', {
    params: {
      path: { group_id: groupId },
      query: { page_size: PAGE_SIZE, cursor },
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
) {
  const shouldFetchExpenses = expenses.buffer.length === 0 && expenses.cursor !== null
  const shouldFetchSettlements = settlements.buffer.length === 0 && settlements.cursor !== null

  const [expensePage, settlementPage] = await Promise.all([
    shouldFetchExpenses ? fetchExpenses(groupId, expenses.cursor ?? undefined) : undefined,
    shouldFetchSettlements ? fetchSettlements(groupId, settlements.cursor ?? undefined) : undefined,
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

async function fetchPage(groupId: string, pageParam: TransactionsPageParam): Promise<TransactionsPage> {
  const expenses: TransactionSource = {
    cursor: pageParam.expenses.cursor,
    buffer: [...pageParam.expenses.buffer],
  }
  const settlements: TransactionSource = {
    cursor: pageParam.settlements.cursor,
    buffer: [...pageParam.settlements.buffer],
  }
  const items: GroupTransaction[] = []

  while (items.length < PAGE_SIZE) {
    const needsRefill =
      (expenses.buffer.length === 0 && expenses.cursor !== null)
      || (settlements.buffer.length === 0 && settlements.cursor !== null)
    if (needsRefill) {
      await refillEmptySources(groupId, expenses, settlements)
    }

    const nextExpense = expenses.buffer[0]
    const nextSettlement = settlements.buffer[0]
    if (!nextExpense && !nextSettlement) break

    if (!nextSettlement || (nextExpense && compareTransactions(nextExpense, nextSettlement) <= 0)) {
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
 * and settlements into one infinitely-scrollable timeline using the same
 * buffered two-cursor merge, so loaded rows never reorder. */
export function useGroupTransactionsQuery(groupId: string | undefined) {
  const query = useInfiniteQuery({
    // Keep the existing prefix so mutation invalidations still match, while
    // preventing persisted data from the previous non-infinite query shape
    // from being read as InfiniteData.
    queryKey: ['group-transactions', groupId, 'infinite-v2'],
    queryFn: ({ pageParam }: { pageParam: TransactionsPageParam }) => fetchPage(groupId!, pageParam),
    initialPageParam: INITIAL_PAGE_PARAM,
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
