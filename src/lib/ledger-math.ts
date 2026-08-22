// Local (offline) replica of the backend's balance math — see
// apps/expenses/services.py's `_compute_net_positions`/`_compute_ledger_entries`
// (per-expense greedy debtor/creditor matching) and `group_balances`
// (Smart Settle's whole-group re-netting). Used so the app can show real
// last-known balances offline instead of just "you're offline."
//
// PairwiseBalance's own docstring is explicit: "sum across every group row
// + the direct row, per currency, never summed across currencies" — a
// scope's expenses/settlements are NOT all one currency (each Expense/
// Settlement carries its own `currency`), so every function here groups by
// currency first and nets each currency's amounts independently, exactly
// mirroring that invariant. No cross-currency conversion happens anywhere
// in this file.
//
// Money is always integer cents internally — never a JS float — mirroring
// this app's existing "never do float arithmetic on money" convention
// (see src/lib/currency.ts).

import type { components } from '@/lib/api/schema'

type ExpenseRead = components['schemas']['ExpenseRead']
type SettlementRead = components['schemas']['SettlementRead']
type UserSummary = components['schemas']['UserSummary']
type PersonBalance = components['schemas']['PersonBalance']

function toCents(amount: string | number): number {
  return Math.round(Number(amount) * 100)
}

/** amount > 0: user is a net creditor (owed money). amount < 0: net debtor. */
export type NetPositions = Map<string, number>

/** One expense's or the whole scope's per-user net position, in cents. */
export function computeNetPositions(
  payerAmounts: Map<string, number>,
  owedAmounts: Map<string, number>,
): NetPositions {
  const userIds = new Set([...payerAmounts.keys(), ...owedAmounts.keys()])
  const positions: NetPositions = new Map()
  for (const uid of userIds) {
    positions.set(uid, (payerAmounts.get(uid) ?? 0) - (owedAmounts.get(uid) ?? 0))
  }
  return positions
}

export interface LedgerEntry {
  debtorId: string
  creditorId: string
  amountCents: number
}

/** Greedy min-entry-count debtor/creditor matching — direct port of the
 * backend's `_compute_ledger_entries`. Deterministic (ties broken by user
 * id) so it always produces the same routing for the same input, same
 * guarantee the backend relies on. */
export function computeLedgerEntries(netPositions: NetPositions): LedgerEntry[] {
  const creditors = [...netPositions.entries()]
    .filter(([, amt]) => amt > 0)
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .map(([id, amt]) => ({ id, amt }))
  const debtors = [...netPositions.entries()]
    .filter(([, amt]) => amt < 0)
    .map(([id, amt]) => ({ id, amt: -amt }))
    .sort((a, b) => (b.amt - a.amt) || a.id.localeCompare(b.id))

  const entries: LedgerEntry[] = []
  let ci = 0
  let di = 0
  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci]
    const debtor = debtors[di]
    const settleAmt = Math.min(creditor.amt, debtor.amt)
    entries.push({ debtorId: debtor.id, creditorId: creditor.id, amountCents: settleAmt })
    creditor.amt -= settleAmt
    debtor.amt -= settleAmt
    if (creditor.amt === 0) ci += 1
    if (debtor.amt === 0) di += 1
  }
  return entries
}

/** One expense's payer/split amounts, in cents, keyed by user id. */
function expensePositions(expense: ExpenseRead): NetPositions {
  const payerAmounts = new Map<string, number>()
  for (const p of expense.payers) {
    payerAmounts.set(p.id, (payerAmounts.get(p.id) ?? 0) + toCents(p.amount))
  }
  const owedAmounts = new Map<string, number>()
  for (const s of expense.splits) {
    const owed = toCents(s.amount_owed) + toCents(s.extra_amount)
    owedAmounts.set(s.id, (owedAmounts.get(s.id) ?? 0) + owed)
  }
  return computeNetPositions(payerAmounts, owedAmounts)
}

/** Accumulates every expense's own per-expense ledger entries, plus one
 * direct entry per CONFIRMED settlement (debtor=payee, creditor=payer —
 * mirrors apps/expenses/services.py's `_apply_settlement_ledger`), into a
 * running per-pair-per-currency total — the same running total
 * PairwiseBalance holds server-side (see this file's header comment on
 * why currency is part of the grouping key). A settlement that's since
 * been disputed simply isn't 'confirmed' anymore and drops out of this
 * sum on its own, which is exactly what a server-side reversal entry
 * accomplishes too — no separate reversal-modeling needed here. */
export function accumulatePairwiseTotals(
  expenses: ExpenseRead[],
  confirmedSettlements: SettlementRead[],
): Map<string, number> {
  // Keyed by "currency|lowerId|higherId" (ids sorted so a-b and b-a share
  // one bucket), value signed from the FIRST id's perspective (positive =
  // first is owed).
  const totals = new Map<string, number>()
  const add = (debtorId: string, creditorId: string, amountCents: number, currency: string) => {
    if (debtorId === creditorId) return
    const [a, b] = [debtorId, creditorId].sort()
    const key = `${currency}|${a}|${b}`
    const sign = a === creditorId ? 1 : -1
    totals.set(key, (totals.get(key) ?? 0) + sign * amountCents)
  }

  for (const expense of expenses) {
    const positions = expensePositions(expense)
    for (const entry of computeLedgerEntries(positions)) {
      add(entry.debtorId, entry.creditorId, entry.amountCents, expense.currency)
    }
  }
  for (const settlement of confirmedSettlements) {
    if (settlement.status !== 'confirmed') continue
    // debtor=payee, creditor=payer — see this function's own doc comment.
    add(settlement.payee.id, settlement.payer.id, toCents(settlement.amount), settlement.currency)
  }
  return totals
}

export interface PairwiseBalance {
  otherUserId: string
  currency: string
  /** Cents, signed from `meId`'s perspective — positive = owed to you. */
  netCents: number
}

/** "How do I stand with each other person in this scope" — the
 * unsimplified (Smart Settle OFF, the default) view FriendshipBalanceView/
 * GroupBalanceView show. One row per (other person, currency) pair,
 * mirroring PersonBalance's own shape. */
export function computeUnsimplifiedBalances(
  expenses: ExpenseRead[],
  confirmedSettlements: SettlementRead[],
  meId: string,
): PairwiseBalance[] {
  const totals = accumulatePairwiseTotals(expenses, confirmedSettlements)
  const balances: PairwiseBalance[] = []
  for (const [key, signedAmount] of totals) {
    const [currency, a, b] = key.split('|')
    if (a !== meId && b !== meId) continue
    const otherUserId = a === meId ? b : a
    const netCents = a === meId ? signedAmount : -signedAmount
    if (netCents !== 0) balances.push({ otherUserId, currency, netCents })
  }
  return balances
}

/** Smart Settle's whole-scope re-netting — one greedy match over every
 * member's AGGREGATE net position across the scope's entire history,
 * instead of accumulating each expense's own routing. Never changes
 * anyone's real total, only which pairs a debt is routed through (see
 * apps/expenses/services.py's `group_balances` docstring). Netted and
 * re-matched independently per currency, same as computeUnsimplifiedBalances. */
export function computeSimplifiedBalances(
  expenses: ExpenseRead[],
  confirmedSettlements: SettlementRead[],
  meId: string,
): PairwiseBalance[] {
  const positionsByCurrency = new Map<string, NetPositions>()
  const addPosition = (currency: string, userId: string, deltaCents: number) => {
    const positions = positionsByCurrency.get(currency) ?? new Map<string, number>()
    positions.set(userId, (positions.get(userId) ?? 0) + deltaCents)
    positionsByCurrency.set(currency, positions)
  }
  for (const expense of expenses) {
    for (const [userId, amt] of expensePositions(expense)) addPosition(expense.currency, userId, amt)
  }
  for (const settlement of confirmedSettlements) {
    if (settlement.status !== 'confirmed') continue
    const amountCents = toCents(settlement.amount)
    // Same debtor=payee/creditor=payer fact as accumulatePairwiseTotals:
    // the payee's position moves down (they now "owe" that much back),
    // the payer's moves up.
    addPosition(settlement.currency, settlement.payee.id, -amountCents)
    addPosition(settlement.currency, settlement.payer.id, amountCents)
  }

  const balances: PairwiseBalance[] = []
  for (const [currency, positions] of positionsByCurrency) {
    for (const entry of computeLedgerEntries(positions)) {
      if (entry.debtorId !== meId && entry.creditorId !== meId) continue
      balances.push({
        otherUserId: entry.debtorId === meId ? entry.creditorId : entry.debtorId,
        currency,
        netCents: entry.creditorId === meId ? entry.amountCents : -entry.amountCents,
      })
    }
  }
  return balances
}

/** Every user this scope's own data mentions, keyed by id — expenses'
 * payers/splits and settlements' payer/payee already carry a full
 * name/phone/image, so no separate contacts/members fetch is needed to
 * resolve `otherUserId` into a displayable person for `toPersonBalances`. */
export function resolveUserSummaries(
  expenses: ExpenseRead[],
  settlements: SettlementRead[],
): Map<string, UserSummary> {
  const users = new Map<string, UserSummary>()
  const add = (user: UserSummary) => users.set(user.id, user)
  for (const expense of expenses) {
    for (const p of expense.payers) add({ id: p.id, full_name: p.full_name, phone_number: p.phone_number, image: p.image })
    for (const s of expense.splits) add({ id: s.id, full_name: s.full_name, phone_number: s.phone_number, image: s.image })
  }
  for (const settlement of settlements) {
    add(settlement.payer)
    add(settlement.payee)
  }
  return users
}

/** Reshapes local PairwiseBalance rows into the same PersonBalance[]
 * shape FriendshipBalanceView/GroupBalanceView return — see
 * apps/expenses/serializers.py's PersonBalanceSerializer/`_direction_for`
 * for the exact sign convention this mirrors (positive net = owed_to_you). */
export function toPersonBalances(
  balances: PairwiseBalance[],
  userSummaries: Map<string, UserSummary>,
): PersonBalance[] {
  return balances.flatMap((balance) => {
    const other_user = userSummaries.get(balance.otherUserId)
    if (!other_user) return []
    return [{
      other_user,
      currency: balance.currency,
      net_amount: (Math.abs(balance.netCents) / 100).toFixed(2),
      direction: balance.netCents > 0 ? 'owed_to_you' as const : balance.netCents < 0 ? 'you_owe' as const : 'settled' as const,
    }]
  })
}
