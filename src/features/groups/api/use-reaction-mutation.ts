import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'
import { useAuthStore } from '@/store/use-auth-store'
import type { components } from '@/lib/api/schema'
import { queueMutation } from '@/lib/sync/mutation-outbox'
import { getLocalExpense, updateLocalExpenseReactions } from '@/lib/sqlite/expenses-store'
import { getSnapshotRecord, upsertSnapshotRecord } from '@/lib/sqlite/resource-snapshot-store'

type ReactionEntry = components['schemas']['ReactionRead']

interface ToggleReactionInput {
  id: string
  kind: 'expense' | 'settlement'
  // Loose here deliberately — ReactionPicker (the only source of this
  // value) is a generic UI component that shouldn't import API schema
  // types. Narrowed to the API's strict EmojiEnum at the actual request
  // boundary below instead, where the cast is easy to justify in one place.
  emoji: string
  groupId?: string
  friendshipId?: string
}

interface TransactionItem {
  data: { id: string; reactions?: ReactionEntry[] }
}

function patchItem<T extends TransactionItem>(
  item: T,
  id: string,
  computeReactions: (current: ReactionEntry[]) => ReactionEntry[],
): T {
  if (item.data.id !== id) return item
  return { ...item, data: { ...item.data, reactions: computeReactions(item.data.reactions ?? []) } }
}

/** Same toggle rule as the backend (apps.expenses.models.Reaction): the
 * same emoji again removes it, anything else upserts it as this user's
 * one active reaction. Used to predict the server's response so the tap
 * feels instant instead of waiting out a round trip. */
function toggleOptimistic(current: ReactionEntry[], mine: ReactionEntry): ReactionEntry[] {
  const withoutMine = current.filter((r) => r.id !== mine.id)
  const hadSameEmoji = current.some((r) => r.id === mine.id && r.emoji === mine.emoji)
  return hadSameEmoji ? withoutMine : [...withoutMine, mine]
}

interface TransactionSource {
  cursor?: string | null
  buffer: TransactionItem[]
}

interface TransactionsPageParam {
  expenses: TransactionSource
  settlements: TransactionSource
}

interface TransactionsPage {
  items: TransactionItem[]
  nextPageParam?: TransactionsPageParam
}

interface TransactionsCache {
  pages: TransactionsPage[]
  pageParams: TransactionsPageParam[]
}

// The merged group/friendship transaction feeds (use-group-transactions-
// query.ts / use-friendship-transactions-query.ts) fetch ahead of what
// they surface into a page's `items`, stashing the unconsumed remainder
// in each pageParam's own expenses/settlements `buffer` for the next page
// fetch to resume from. A patch that only touched `items` would have a
// reacted-to row silently revert to its pre-reaction state the moment a
// buffered copy of it later drains into a rendered page — so both have
// to be patched here.
function patchCache(
  old: TransactionsCache | undefined,
  id: string,
  computeReactions: (current: ReactionEntry[]) => ReactionEntry[],
) {
  if (!old) return old
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => patchItem(item, id, computeReactions)),
    })),
    pageParams: old.pageParams.map((pp) => {
      if (!pp) return pp
      return {
        expenses: { ...pp.expenses, buffer: pp.expenses.buffer.map((item) => patchItem(item, id, computeReactions)) },
        settlements: { ...pp.settlements, buffer: pp.settlements.buffer.map((item) => patchItem(item, id, computeReactions)) },
      }
    }),
  }
}

interface MutationContext {
  previous: [QueryKey, TransactionsCache | undefined][]
}

/** Toggles the current user's reaction on one Expense or Settlement row —
 * same emoji again removes it, a different emoji replaces it (see
 * apps.expenses.models.Reaction's docstring). Applies the toggle
 * optimistically (onMutate) so the tap feels instant — WhatsApp itself
 * never waits on a round trip for this — then reconciles with the
 * server's own returned reaction list on success, and rolls back to the
 * pre-mutation snapshot on failure. Uses partial-key setQueriesData so
 * every cached sort/filter variant of the group feed (sort/filter are
 * part of that query key) gets patched, not just the currently-active
 * one. */
export function useToggleReactionMutation() {
  const queryClient = useQueryClient()
  return useMutation<{ reactions: ReactionEntry[] }, ApiError, ToggleReactionInput, MutationContext>({
    mutationFn: async ({ id, kind, emoji }) => {
      const profile = useAuthStore.getState().userProfile
      if (!profile?.id) throw new ApiError('Sign in before reacting.')
      const source = kind === 'expense'
        ? await getLocalExpense(profile.id, id)
        : await getSnapshotRecord<components['schemas']['SettlementRead']>(profile.id, 'settlements', id)
      const mine: ReactionEntry = {
        id: profile.id, full_name: profile.name ?? '', phone_number: profile.phone ?? '',
        image: profile.avatar ?? null, emoji,
      }
      const optimistic = { reactions: toggleOptimistic(source?.reactions ?? [], mine) }
      const result = await queueMutation({
        resource: 'reactions', method: 'POST',
        path: kind === 'expense' ? `/api/expenses/${id}/react/` : `/api/expenses/settlements/${id}/react/`,
        body: { emoji }, optimisticResult: optimistic,
      })
      if (kind === 'settlement' && source) {
        await upsertSnapshotRecord(profile.id, 'settlements', {
          id, scopeId: source.group ?? source.friendship ?? null,
          data: { ...source, reactions: result.data.reactions },
        })
      }
      if (kind === 'expense') await updateLocalExpenseReactions(profile.id, id, result.data.reactions)
      return result.data
    },
    onMutate: async ({ id, emoji, groupId, friendshipId }) => {
      const profile = useAuthStore.getState().userProfile
      const queryKey = groupId ? ['group-transactions', groupId] : friendshipId ? ['friendship-transactions', friendshipId] : null
      if (!profile?.id || !queryKey) return { previous: [] }

      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueriesData<TransactionsCache>({ queryKey })

      const mine: ReactionEntry = {
        id: profile.id,
        full_name: profile.name ?? '',
        phone_number: profile.phone ?? '',
        image: profile.avatar ?? null,
        emoji,
      }
      queryClient.setQueriesData<TransactionsCache>({ queryKey }, (old) =>
        patchCache(old, id, (current) => toggleOptimistic(current, mine)),
      )

      return { previous }
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSuccess: (result, { id, groupId, friendshipId }) => {
      if (groupId) {
        queryClient.setQueriesData<TransactionsCache>(
          { queryKey: ['group-transactions', groupId] },
          (old) => patchCache(old, id, () => result.reactions),
        )
      }
      if (friendshipId) {
        queryClient.setQueriesData<TransactionsCache>(
          { queryKey: ['friendship-transactions', friendshipId] },
          (old) => patchCache(old, id, () => result.reactions),
        )
      }
    },
  })
}
