// Local (offline) replica of apps/expenses/services.py's
// wallet_people/wallet_groups/wallet_summary — see those functions'
// docstrings for the exact contract this mirrors. Reuses ledger-math.ts's
// per-scope balance computation (one call per group/friendship), then
// aggregates across every locally-cached scope the same way the backend
// aggregates across every PairwiseBalance row.
//
// Currency: a group row's own net_amount stays in the group's own
// currency, unconverted (matches wallet_groups — "single-scope views
// stay unconverted"). Aggregating across scopes for a person row or the
// wallet summary needs everything in the viewer's own default_currency;
// converted the same way as my-expenses-local.ts — via each GROUP's own
// cached currency_rates (verified direction), using the CURRENT rate
// (not the historical one, an accepted approximation, same as
// my-expenses-local.ts and the wallet's already-agreed-on limitation).
// Friendship-scoped foreign-currency balances are not converted here for
// the same reason given in my-expenses-local.ts's header — left
// unconverted (added at face value) rather than risk the wrong direction.
//
// `breakdown` (the itemized per-scope/per-member expansion the live
// wallet list rows carry) is left empty here — an accepted, documented
// degradation (less breakdown detail, not wrong data), matching this
// project's existing "acceptable to degrade to less detail offline"
// precedent for other minor hooks.

import type { components } from '@/lib/api/schema'
import { computeSimplifiedBalances, computeUnsimplifiedBalances, resolveUserSummaries } from '@/lib/ledger-math'

type ExpenseRead = components['schemas']['ExpenseRead']
type SettlementRead = components['schemas']['SettlementRead']
type Group = components['schemas']['Group']
type Friendship = components['schemas']['Friendship']
type UserSummary = components['schemas']['UserSummary']
type WalletRow = components['schemas']['WalletRow']
type WalletSummary = components['schemas']['WalletSummary']

function convertCents(cents: number, fromCurrency: string, viewerCurrency: string, group: Group | undefined): number {
  if (fromCurrency === viewerCurrency) return cents
  const rate = group?.currency_rates?.find((r) => r.currency === viewerCurrency)?.rate
  if (!rate) return cents
  return Math.round(cents * Number(rate))
}

function toAmount(cents: number): string {
  return (cents / 100).toFixed(2)
}

export interface LocalWalletInput {
  groups: Group[]
  friendships: Friendship[]
  expensesByScopeId: Map<string, ExpenseRead[]>
  settlementsByScopeId: Map<string, SettlementRead[]>
  meId: string
  viewerCurrency: string
}

export function computeLocalWalletGroups(input: LocalWalletInput): WalletRow[] {
  const { groups, expensesByScopeId, settlementsByScopeId, meId } = input
  return groups.map((group) => {
    const expenses = expensesByScopeId.get(group.id) ?? []
    const settlements = (settlementsByScopeId.get(group.id) ?? []).filter((s) => s.status === 'confirmed')
    const balances = group.smart_settle_enabled
      ? computeSimplifiedBalances(expenses, settlements, meId)
      : computeUnsimplifiedBalances(expenses, settlements, meId)

    // A group's own rows should already share one currency (its own
    // default_currency); summing defensively per-currency and picking
    // the largest bucket handles the rare mixed case without crashing.
    const totalsByCurrency = new Map<string, number>()
    for (const b of balances) totalsByCurrency.set(b.currency, (totalsByCurrency.get(b.currency) ?? 0) + b.netCents)
    let currency = group.default_currency
    let netCents = totalsByCurrency.get(currency) ?? 0
    if (!totalsByCurrency.has(currency) && totalsByCurrency.size > 0) {
      const [topCurrency, topCents] = [...totalsByCurrency.entries()].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]
      currency = topCurrency
      netCents = topCents
    }

    const latest = [...expenses.map((e) => e.date), ...settlements.map((s) => s.date), group.created_at]
      .sort()
      .at(-1)!

    return {
      row_type: 'group',
      other_user: null,
      group: { id: group.id, name: group.name, image: group.image ?? null },
      net_amount: toAmount(netCents),
      currency,
      latest_activity: latest,
      balance_count: null,
      breakdown: [],
    }
  })
}

export function computeLocalWalletPeople(input: LocalWalletInput): WalletRow[] {
  const { groups, friendships, expensesByScopeId, settlementsByScopeId, meId, viewerCurrency } = input
  const totalsByPerson = new Map<string, number>()
  const latestByPerson = new Map<string, string>()
  const usersById = new Map<string, UserSummary>()

  const bumpLatest = (userId: string, iso: string) => {
    if (!latestByPerson.has(userId) || iso > latestByPerson.get(userId)!) latestByPerson.set(userId, iso)
  }

  for (const group of groups) {
    const expenses = expensesByScopeId.get(group.id) ?? []
    const settlements = (settlementsByScopeId.get(group.id) ?? []).filter((s) => s.status === 'confirmed')
    const balances = group.smart_settle_enabled
      ? computeSimplifiedBalances(expenses, settlements, meId)
      : computeUnsimplifiedBalances(expenses, settlements, meId)
    for (const [id, user] of resolveUserSummaries(expenses, settlements)) usersById.set(id, user)
    for (const b of balances) {
      const converted = convertCents(b.netCents, b.currency, viewerCurrency, group)
      totalsByPerson.set(b.otherUserId, (totalsByPerson.get(b.otherUserId) ?? 0) + converted)
    }
    const latest = [...expenses.map((e) => e.date), ...settlements.map((s) => s.date)]
    for (const iso of latest) {
      for (const b of balances) bumpLatest(b.otherUserId, iso)
    }
  }

  for (const friendship of friendships) {
    const expenses = expensesByScopeId.get(friendship.id) ?? []
    const settlements = (settlementsByScopeId.get(friendship.id) ?? []).filter((s) => s.status === 'confirmed')
    const balances = computeUnsimplifiedBalances(expenses, settlements, meId)
    for (const [id, user] of resolveUserSummaries(expenses, settlements)) usersById.set(id, user)
    if (friendship.friend) usersById.set(friendship.friend.id, friendship.friend)
    for (const b of balances) {
      // No group to convert through here — see file header on why
      // friendship-scoped foreign-currency amounts pass through unconverted.
      totalsByPerson.set(b.otherUserId, (totalsByPerson.get(b.otherUserId) ?? 0) + b.netCents)
    }
    if (!totalsByPerson.has(friendship.friend.id)) totalsByPerson.set(friendship.friend.id, 0)
    bumpLatest(friendship.friend.id, friendship.created_at)
    for (const iso of [...expenses.map((e) => e.date), ...settlements.map((s) => s.date)]) {
      bumpLatest(friendship.friend.id, iso)
    }
  }

  return [...totalsByPerson.entries()].flatMap(([userId, cents]) => {
    const other_user = usersById.get(userId)
    if (!other_user) return []
    return [{
      row_type: 'person',
      other_user,
      group: null,
      net_amount: toAmount(cents),
      currency: viewerCurrency,
      latest_activity: latestByPerson.get(userId) ?? new Date(0).toISOString(),
      balance_count: null,
      breakdown: [],
    }]
  })
}

export function computeLocalWalletList(input: LocalWalletInput): WalletRow[] {
  return [...computeLocalWalletPeople(input), ...computeLocalWalletGroups(input)]
    .sort((a, b) => b.latest_activity.localeCompare(a.latest_activity))
}

export function computeLocalWalletSummary(input: LocalWalletInput): WalletSummary {
  const people = computeLocalWalletPeople(input)
  let receivableCents = 0
  let payableCents = 0
  for (const row of people) {
    const cents = Math.round(Number(row.net_amount) * 100)
    if (cents > 0) receivableCents += cents
    else payableCents += -cents
  }
  return {
    receivable: toAmount(receivableCents),
    payable: toAmount(payableCents),
    net: toAmount(receivableCents - payableCents),
    currency: input.viewerCurrency,
  }
}
