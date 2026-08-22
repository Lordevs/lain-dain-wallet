// Shared local-data assembly for the wallet's offline fallback — both
// useWalletSummaryQuery and useWalletListQuery need the exact same
// (groups, friendships, expenses-by-scope, settlements-by-scope) input
// for wallet-local.ts's computations, so this builds it once rather than
// duplicating the SQLite reads/bucketing in each hook.

import type { components } from '@/lib/api/schema'
import { getLocalExpenses } from '@/lib/sqlite/expenses-store'
import { getResourceSnapshot, getSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'
import type { LocalWalletInput } from '@/lib/wallet-local'

type SettlementRead = components['schemas']['SettlementRead']

export async function buildLocalWalletInput(ownerId: string): Promise<LocalWalletInput | null> {
  const [allExpenses, allSettlements, groups, friendships, profile] = await Promise.all([
    getLocalExpenses(ownerId),
    getResourceSnapshot<SettlementRead>(ownerId, 'settlement-ledger'),
    getResourceSnapshot<components['schemas']['Group']>(ownerId, 'groups'),
    getResourceSnapshot<components['schemas']['Friendship']>(ownerId, 'friendships'),
    getSnapshotRecord<components['schemas']['User']>(ownerId, 'profile', ownerId),
  ])
  if (!profile?.default_currency) return null

  const expensesByScopeId = new Map<string, components['schemas']['ExpenseRead'][]>()
  for (const e of allExpenses) {
    const scopeId = e.group ?? e.friendship
    if (!scopeId) continue
    expensesByScopeId.set(scopeId, [...(expensesByScopeId.get(scopeId) ?? []), e])
  }

  const settlementsByScopeId = new Map<string, SettlementRead[]>()
  for (const s of allSettlements) {
    const scopeId = s.group ?? s.friendship
    if (!scopeId) continue
    settlementsByScopeId.set(scopeId, [...(settlementsByScopeId.get(scopeId) ?? []), s])
  }

  return {
    groups,
    friendships,
    expensesByScopeId,
    settlementsByScopeId,
    meId: ownerId,
    viewerCurrency: profile.default_currency,
  }
}
