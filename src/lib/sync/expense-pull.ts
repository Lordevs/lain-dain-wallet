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
 * the complete page has been durably written to SQLite. Returns whether
 * the feed reached its watermark without a failed page fetch — skips (a
 * held mutex or being called offline/signed out) also report `true`, so
 * only real network/server failures reach backoff accounting. Never
 * rejects; see triggers.ts's runSyncChannel for how this is consumed. */
export async function pullExpenseChanges(): Promise<boolean> {
  if (isPulling || !onlineManager.isOnline()) return true
  const ownerId = useAuthStore.getState().userProfile?.id
  if (!ownerId) return true

  isPulling = true
  try {
    const resource = `expenses:${ownerId}`
    let cursor = await getSyncCursor(resource)
    let hasMore = true
    while (hasMore) {
      const { data, error } = await apiClient.GET('/api/sync/expenses/', {
        params: { query: cursor ? { since: cursor } : {} },
      })
      // Any failed page fetch backs off the whole channel: pull endpoints
      // are authenticated GETs this client is already authorized for, so a
      // persistent error here means something is wrong enough that pacing
      // retries is right regardless of the specific status.
      if (error || !data) return false
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
    return true
  } finally {
    isPulling = false
  }
}

function cursorFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return new URL(url).searchParams.get('since')
}
