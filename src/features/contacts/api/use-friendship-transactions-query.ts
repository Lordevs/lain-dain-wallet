import { useMemo } from 'react'
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toApiError } from '@/lib/api/errors'
import type { components } from '@/lib/api/schema'
import { onlineManager } from '@tanstack/react-query'
import { useAuthStore } from '@/store/use-auth-store'
import { getLocalExpenses, upsertServerExpense } from '@/lib/sqlite/expenses-store'

export type FriendshipTransaction =
  | { kind: 'expense'; date: string; data: components['schemas']['ExpenseRead'] }
  | { kind: 'settlement'; date: string; data: components['schemas']['SettlementRead'] }

const PAGE_SIZE = 20

interface TransactionSource {
  /** `undefined` = first page; a string = next page; `null` = exhausted. */
  cursor?: string | null
  buffer: FriendshipTransaction[]
}

interface TransactionsPageParam {
  expenses: TransactionSource
  settlements: TransactionSource
}

interface TransactionsPage {
  items: FriendshipTransaction[]
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

function compareTransactions(a: FriendshipTransaction, b: FriendshipTransaction): number {
  // Newest first by the user-editable `date` — a backdated or future-dated
  // expense sorts by the date the user picked, not by when it was inserted.
  const byDate = b.data.date.localeCompare(a.data.date)
  if (byDate !== 0) return byDate

  // Match both backend cursors' exact secondary ordering: ("-date", "-id").
  const byId = b.data.id.localeCompare(a.data.id)
  if (byId !== 0) return byId

  return a.kind.localeCompare(b.kind)
}

async function fetchExpenses(
  friendshipId: string,
  cursor: string | undefined,
): Promise<{ items: FriendshipTransaction[]; nextCursor: string | null }> {
  const ownerId = useAuthStore.getState().userProfile?.id
  if (!onlineManager.isOnline() && ownerId) {
    const expenses = await getLocalExpenses(ownerId, { friendshipId })
    return {
      items: expenses.map((expense) => ({ kind: 'expense' as const, date: expense.date, data: expense })),
      nextCursor: null,
    }
  }
  const { data, error } = await apiClient.GET('/api/expenses/friendships/{friendship_id}/', {
    params: {
      path: { friendship_id: friendshipId },
      query: { page_size: PAGE_SIZE, cursor, sort: 'newest' },
    },
  })
  if (error) throw toApiError(error)
  if (ownerId) {
    await Promise.all(data.results.map((expense) => upsertServerExpense(ownerId, {
      ...expense, updated_at: expense.edited_at ?? expense.created_at, is_deleted: false, deleted_at: null,
    })))
  }

  return {
    items: data.results.map((expense) => ({ kind: 'expense', date: expense.date, data: expense })),
    nextCursor: cursorFromUrl(data.next),
  }
}

async function fetchSettlements(
  friendshipId: string,
  cursor: string | undefined,
): Promise<{ items: FriendshipTransaction[]; nextCursor: string | null }> {
  if (!onlineManager.isOnline()) return { items: [], nextCursor: null }
  const { data, error } = await apiClient.GET('/api/expenses/friendships/{friendship_id}/settlements/', {
    params: {
      path: { friendship_id: friendshipId },
      query: { page_size: PAGE_SIZE, cursor, sort: 'newest' },
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
  friendshipId: string,
  expenses: TransactionSource,
  settlements: TransactionSource,
) {
  const shouldFetchExpenses = expenses.buffer.length === 0 && expenses.cursor !== null
  const shouldFetchSettlements = settlements.buffer.length === 0 && settlements.cursor !== null

  const [expensePage, settlementPage] = await Promise.all([
    shouldFetchExpenses ? fetchExpenses(friendshipId, expenses.cursor ?? undefined) : undefined,
    shouldFetchSettlements ? fetchSettlements(friendshipId, settlements.cursor ?? undefined) : undefined,
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

async function fetchPage(friendshipId: string, pageParam: TransactionsPageParam): Promise<TransactionsPage> {
  // Clone because TanStack stores pageParams in the cache; mutating one in
  // place would also mutate the previously-cached page's merge frontier.
  const expenses: TransactionSource = {
    cursor: pageParam.expenses.cursor,
    buffer: [...pageParam.expenses.buffer],
  }
  const settlements: TransactionSource = {
    cursor: pageParam.settlements.cursor,
    buffer: [...pageParam.settlements.buffer],
  }
  const items: FriendshipTransaction[] = []

  while (items.length < PAGE_SIZE) {
    const needsRefill =
      (expenses.buffer.length === 0 && expenses.cursor !== null)
      || (settlements.buffer.length === 0 && settlements.cursor !== null)
    if (needsRefill) {
      await refillEmptySources(friendshipId, expenses, settlements)
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

// Expenses and Settlements are two separate models/endpoints server-side
// (see apps/expenses/urls.py), but a friendship's history screen shows
// them as one merged, date-ordered timeline. The buffers preserve each
// source's unconsumed rows, allowing a normal merge-sort across the two
// cursors without inserting later pages above already-rendered history.
export function useFriendshipTransactionsQuery(friendshipId: string | undefined) {
  const query = useInfiniteQuery({
    // Keep the existing prefix so mutation invalidations still match, while
    // preventing persisted data from the previous non-infinite query shape
    // from being read as InfiniteData.
    // v4 switches this feed back to newest-first by `date` (v3 was
    // ascending-by-created_at) — cursor directions must never be mixed, so
    // the version bump keeps any already-cached v3 pages from being read
    // under the new ordering.
    queryKey: ['friendship-transactions', friendshipId, 'infinite-v4'],
    queryFn: ({ pageParam }: { pageParam: TransactionsPageParam }) => fetchPage(friendshipId!, pageParam),
    initialPageParam: INITIAL_PAGE_PARAM,
    getNextPageParam: (lastPage) => lastPage.nextPageParam,
    enabled: !!friendshipId,
    networkMode: 'always',
    // Navigating between two different contacts' transaction screens
    // reuses this same route/component — friendshipId changes but the
    // component doesn't remount, so without this it would flash empty
    // instead of keeping the previous contact's timeline up while the
    // new one's first page loads.
    placeholderData: keepPreviousData,
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
