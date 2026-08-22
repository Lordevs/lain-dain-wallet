import { onlineManager } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useAuthStore } from '@/store/use-auth-store'
import { upsertSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import { getSyncCursor, setSyncCursor } from '@/lib/sqlite/sync-cursor-store'
import type { components } from '@/lib/api/schema'

type SettlementDelta = components['schemas']['SettlementDelta']

// The generated response type for this endpoint is wrong (drf-spectacular
// can't infer DeltaCursorPagination's actual custom shape from a plain
// CursorPagination subclass) — same known mismatch as ExpenseDeltaPage in
// expense-pull.ts. The real shape is {results, next_cursor}.
interface SettlementDeltaPage {
  results: SettlementDelta[]
  next_cursor?: string | null
}

let isPulling = false

/** Full settlement history (not just currently-active/uncleared ones —
 * see apps.expenses.views.SettlementDeltaView's own docstring for why),
 * kept in the generic resource_snapshots store under 'settlement-ledger'
 * so the local balance math in ledger-math.ts has every CONFIRMED
 * settlement to net against, scoped by group/friendship id the same way
 * the 'settlements'/'recurring' resources already are. Deliberately a
 * separate resource key from 'settlements' (the full-replace snapshot
 * pulled by offline-snapshot.ts) — that one is periodically wiped and
 * only ever holds the current *uncleared* subset for the existing
 * settlement-detail/action screens; this one is append/update-only via
 * delta pull and keeps every settlement ever seen, cleared or not. */
export async function pullSettlementChanges(): Promise<void> {
  if (isPulling || !onlineManager.isOnline()) return
  const ownerId = useAuthStore.getState().userProfile?.id
  if (!ownerId) return

  isPulling = true
  try {
    const resource = `settlements:${ownerId}`
    let cursor = await getSyncCursor(resource)
    let hasMore = true
    while (hasMore) {
      const { data, error } = await apiClient.GET('/api/sync/settlements/', {
        params: { query: cursor ? { since: cursor } : {} },
      })
      if (error || !data) return
      const page = data as unknown as SettlementDeltaPage
      for (const settlement of page.results) {
        await upsertSnapshotRecord(ownerId, 'settlement-ledger', {
          id: settlement.id,
          scopeId: settlement.group ?? settlement.friendship ?? null,
          data: settlement,
        })
      }

      const nextCursor = page.next_cursor ?? null
      if (!nextCursor || nextCursor === cursor) {
        hasMore = false
        continue
      }
      await setSyncCursor(resource, nextCursor)
      cursor = nextCursor
    }
  } finally {
    isPulling = false
  }
}
