import type { components } from '@/lib/api/schema'
import type { Contact, LedgerTag } from '@/types'
import { colorForName, initialsForName } from '@/lib/avatar-visuals'

type WalletRow = components['schemas']['WalletRow']

/**
 * Maps one row of GET /api/expenses/wallet/ into the app's canonical
 * `Contact` shape, so the existing dashboard UI (BalanceSummaryCard,
 * ContactLedgerCard, SearchResultsOverlay) can render real data without
 * each one learning the wallet API's own row_type/breakdown shape.
 *
 * `net_amount`/breakdown amounts are already signed (positive = owed to
 * you) — see WalletRowSerializer/WalletBreakdownItemSerializer, no
 * separate direction field to reconcile, unlike the contacts feature's
 * PersonBalanceSerializer.
 *
 * No `isOnline` is set — there is no presence concept anywhere in this
 * backend; the mock data's online dot was purely decorative and has
 * nothing real to render here.
 */
export function mapWalletRow(row: WalletRow): Contact {
  const isGroup = row.row_type === 'group'
  const name = (isGroup ? row.group?.name : row.other_user?.full_name) ?? 'Unknown'
  const id = (isGroup ? row.group?.id : row.other_user?.id) ?? ''
  const avatar = isGroup ? row.group?.image : row.other_user?.image

  const tags: LedgerTag[] = row.breakdown.map((item) => ({
    name: (isGroup ? item.other_user?.full_name : item.group?.name) ?? (isGroup ? 'Member' : 'Personal'),
    amount: Number(item.net_amount),
    currency: item.currency,
  }))

  return {
    id,
    name,
    initials: initialsForName(name),
    avatarColor: colorForName(name),
    avatar,
    ledgerCount: row.balance_count ?? row.breakdown.length,
    netAmount: Number(row.net_amount),
    currency: row.currency,
    latestActivity: row.latest_activity,
    tags,
    type: isGroup ? 'group' : 'person',
  }
}
