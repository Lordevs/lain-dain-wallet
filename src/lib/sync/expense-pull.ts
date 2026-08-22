import { onlineManager } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/store/use-auth-store'
import { upsertServerExpense } from '@/lib/sqlite/expenses-store'
import { getSyncCursor, setSyncCursor } from '@/lib/sqlite/sync-cursor-store'

interface ExpenseDeltaPage {
  results: Array<import('@/lib/api/schema').components['schemas']['ExpenseDelta']>
  next_cursor?: string | null
  next?: string | null
}

let isPulling = false

/** Pulls every unseen expense change and advances the cursor only after
 * the complete page has been durably written to SQLite. */
export async function pullExpenseChanges(): Promise<void> {
  if (isPulling || !onlineManager.isOnline()) return
  const ownerId = useAuthStore.getState().userProfile?.id
  if (!ownerId) return

  isPulling = true
  try {
    const resource = `expenses:${ownerId}`
    let cursor = await getSyncCursor(resource)
    let hasMore = true
    while (hasMore) {
      const { data, error } = await apiClient.GET('/api/sync/expenses/', {
        params: { query: cursor ? { since: cursor } : {} },
      })
      if (error || !data) return
      const page = data as unknown as ExpenseDeltaPage
      for (const expense of page.results) {
        await upsertServerExpense(ownerId, expense)
        if (expense.is_deleted) queryClient.removeQueries({ queryKey: ['expense', expense.id] })
        else queryClient.setQueryData(['expense', expense.id], expense)
      }

      const nextCursor = page.next_cursor ?? cursorFromUrl(page.next)
      if (!nextCursor || nextCursor === cursor) {
        hasMore = false
        continue
      }
      await setSyncCursor(resource, nextCursor)
      cursor = nextCursor
      // The backend's real response uses next_cursor. A URL-shaped `next`
      // means generated-schema pagination and may still have another page.
      if (!page.next_cursor && !page.next) hasMore = false
    }

    queryClient.invalidateQueries({ queryKey: ['my-expenses-summary'] })
    queryClient.invalidateQueries({ queryKey: ['my-expenses-list'] })
    queryClient.invalidateQueries({ queryKey: ['my-expenses-report'] })
    queryClient.invalidateQueries({ queryKey: ['friendship-transactions'] })
    queryClient.invalidateQueries({ queryKey: ['group-transactions'] })
    queryClient.invalidateQueries({ queryKey: ['wallet'] })
  } finally {
    isPulling = false
  }
}

function cursorFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return new URL(url).searchParams.get('since')
}
