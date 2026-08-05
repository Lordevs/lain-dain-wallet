# Performance audit: cache reuse, N+1 queries, and index hygiene

## Context

The user reported the app feeling slow — slow to show data, unwanted repeat API calls, cache not being reused, cache not updating when it should. Ran a full audit across frontend (TanStack Query caching/re-renders), backend (Django view/serializer query patterns), and DB (index coverage) via three parallel research passes, then verified every finding against the actual code before proposing fixes.

**Headline result: the codebase is unusually disciplined already.** Global QueryClient config, query-key hygiene, most mutation cache-patching, and nearly every backend list view's `select_related`/`prefetch_related` usage are already correct — verified and ruled out as non-issues (see "Confirmed non-issues" at the end). The real, verified problems are narrower and more mechanical than "slow app" usually implies:

1. **Frontend**: a list-item memoization contract is broken by every caller, so transaction lists re-render every row on unrelated state changes.
2. **Frontend**: several mutations invalidate the entire `user-ledgers` cache (every contact ever viewed) instead of just the one contact affected.
3. **Backend**: one real N+1 query bug in the recurring-expenses list (100 extra queries per page of 50).
4. **DB**: the two highest-write-volume tables (`LedgerEntry`, `PairwiseBalance`) carry duplicate indexes — Django auto-indexes every FK, and explicit `models.Index` declarations re-declare the same columns, doubling index-maintenance cost on every insert.
5. **DB**: a few real query patterns (cross-currency wallet reads, friendship list default ordering, amount-sort) have no supporting index, forcing heap scans or filesorts.

One more finding is real and probably the single biggest contributor to "slow to load data" for some users, but it's an architectural trade-off, not a mechanical fix — flagged at the end as a follow-up, not included in this round's changes.

Fix order: frontend memoization (safe, isolated) → frontend cache-invalidation scoping (safe, isolated) → backend N+1 (safe, isolated) → DB index migration (safe, additive/subtractive only, no query-shape changes). Each phase is independently testable.

---

## Phase 1 — Frontend: fix broken list-item memoization

`src/components/shared/expense-item.tsx` is `memo()`'d and its own doc comment (lines 10-12) says explicitly: the `onClick` prop must be a *stable* function identity from the caller for the memoization to do anything — an inline arrow function defeats it every render. `dashboard-screen.tsx` (lines 118-124) does this correctly with `useCallback`. Every other consumer passes an inline arrow instead, silently defeating the memo on the app's busiest transaction-list screens:

- `src/features/groups/group-detail-screen.tsx:269`
- `src/features/contacts/contact-detail-screen.tsx:291`
- `src/features/personal/personal-screen.tsx:95`
- `src/features/contacts/ledger-breakdown-screen.tsx:122` and `:177`
- `src/features/groups/components/group-category-expenses.tsx:32` and `:78`

**Fix**: in each file, wrap the handler passed as `onClick` to `<ExpenseItem>` in `useCallback` (import `useCallback` from `react` if not already imported), matching `dashboard-screen.tsx`'s existing pattern exactly. No behavior change — purely restores the memoization that's already supposed to be working.

## Phase 2 — Frontend: scope `user-ledgers` cache invalidation

`src/features/contacts/api/use-user-ledgers-query.ts:14` keys this query as `['user-ledgers', userId]` — one cache entry per contact ever viewed via the combined cross-scope ledger view. `invalidateQueries` treats a partial key as a prefix match, so calling it with just `['user-ledgers']` (no `userId`) invalidates *every* cached contact's combined view at once, not just the one that changed. `src/features/contacts/api/use-apply-ledger-adjustment-mutation.ts:34` already does this correctly (`['user-ledgers', userId]`) — every other site doesn't:

- `src/features/expenses/api/use-delete-expense-mutation.ts:31`
- `src/features/expenses/api/use-update-expense-mutation.ts:40`
- `src/features/contacts/api/use-create-friendship-expense-mutation.ts:30`
- `src/features/contacts/api/use-friendship-settings-mutations.ts:105`
- `src/features/groups/api/use-create-group-expense-mutation.ts:34`
- `src/features/groups/api/use-group-actions-mutations.ts:79,100`
- `src/features/settle-up/api/use-settlement-action-mutations.ts:17,75`
- `src/features/settle-up/api/use-create-group-settlement-mutation.ts:41`
- `src/features/settle-up/api/use-create-friendship-settlement-mutation.ts:33`

**Fix, split by how unambiguous the "other user" is:**
- **Friendship-context mutations** (`use-create-friendship-expense-mutation.ts`, `use-friendship-settings-mutations.ts`, `use-create-friendship-settlement-mutation.ts`) — exactly one counterparty; scope directly to that user's id (already available as a mutation argument or in the friendship object).
- **All settlement mutations** (`use-settlement-action-mutations.ts`, `use-create-group-settlement-mutation.ts`) — a `Settlement` always has exactly one `payer`/`payee` pair regardless of friendship-vs-group context, so the "other user" is always unambiguous: whichever of `payer`/`payee` isn't the current viewer (get current user id from `useAuthStore`). Scope to that id.
- **Group-expense mutations** (`use-delete-expense-mutation.ts`/`use-update-expense-mutation.ts` when the expense is group-scoped, `use-create-group-expense-mutation.ts`, `use-group-actions-mutations.ts`) — a group expense can touch several other members at once, and their identities aren't necessarily all available client-side at the mutation call site. **Leave these as broad invalidation** (correct, just not maximally scoped) — narrowing these properly would need the full member list threaded through, which is a bigger change not worth rushing into this pass. Add a one-line comment explaining why these stay broad, so it doesn't read as an oversight later.

## Phase 3 — Backend: fix RecurringExpense list N+1

`apps/expenses/serializers.py:756-836`. `RecurringExpense.payers`/`splits` are `JSONField`s (not real relations, per `apps/expenses/models.py:606-607`), so there's nothing for `prefetch_related` to hook into — but the current code doesn't batch the workaround either. `_resolve_template_users()` (line 756) runs a real `User.objects.filter(id__in=ids)` query, and both `get_payers` (813) and `get_splits` (821) call it independently — 2 queries per row, 100 for a page of 50 (`_RecurringExpensePagination`, page_size up to 200, used by `FriendshipRecurringExpenseListCreateView`/`GroupRecurringExpenseListCreateView`, `apps/expenses/views.py:866-897`).

**Fix**: give `RecurringExpenseReadSerializer` a custom `list_serializer_class` that resolves every row's user ids in one batched query up front (in `to_representation`, before iterating rows) and stashes the result on the child serializer instance; `get_payers`/`get_splits` read from that stash if present, falling back to the current per-object query only when not list-serialized (detail view, single object — `many=True` never applies there, so the stash is never set, and the existing per-object behavior is correct and cheap for one row):

```python
class RecurringExpenseListSerializer(serializers.ListSerializer):
    def to_representation(self, data):
        objects = list(data)
        ids = set()
        for obj in objects:
            ids |= {str(p["user_id"]) for p in obj.payers} | {str(s["user_id"]) for s in obj.splits}
        self.child.prefetched_users = {str(u.id): u for u in User.objects.filter(id__in=ids)}
        return super().to_representation(objects)


def _resolve_template_users(serializer, *, payers, splits):
    prefetched = getattr(serializer, "prefetched_users", None)
    if prefetched is not None:
        return prefetched
    ids = {str(p["user_id"]) for p in payers} | {str(s["user_id"]) for s in splits}
    return {str(u.id): u for u in User.objects.filter(id__in=ids)}
```
And update `RecurringExpenseReadSerializer.Meta` to set `list_serializer_class = RecurringExpenseListSerializer`, and the two call sites (`get_payers`/`get_splits`) to pass `self` as the first argument to `_resolve_template_users`. Result: 100 queries → 1 query per page.

## Phase 4 — DB: remove redundant duplicate indexes

Django creates a database index for every `ForeignKey` automatically (no model here sets `db_index=False`). These models *also* declare an explicit single-column `models.Index` for the same FK fields — a fully redundant second index, doubling write-time index-maintenance cost on the two highest-insert-volume tables in the schema:

- `apps/expenses/models.py:427-433` — `LedgerEntry.Meta.indexes`: `expense`, `settlement`, `group`, `friendship`, `debtor`, `creditor` are all redundant (keep the composite `["group", "-created_at"]` at line ~440 — not redundant).
- `apps/expenses/models.py:502-506` — `PairwiseBalance.Meta.indexes`: `user_a`, `user_b`, `group`, `friendship` are all redundant.
- `apps/expenses/models.py:346-351` — `Settlement.Meta.indexes`: `payer`, `payee` are redundant (keep `["friendship", "-date"]`/`["group", "-date"]`).

**Fix**: remove these 12 redundant `models.Index` entries. Zero behavior/query-plan change (the FK auto-index still exists) — pure write-latency reduction on `bulk_create` calls in `apps/expenses/services.py` (lines 573-574, 650-651, 686-687, 1122, 1348) and every `PairwiseBalance.objects.create(...)`.

## Phase 5 — DB: add missing composite indexes for real query patterns

- **`LedgerEntry`**: add `(debtor, currency)` and `(creditor, currency)`. Backs the cross-currency wallet fallback in `apps/expenses/services.py:992-994` (`Q(debtor=user)|Q(creditor=user)).exclude(currency=...)`) — lets Postgres resolve `currency` from the index instead of a heap fetch per candidate row.
- **`PairwiseBalance`**: add `(user_a, currency)` and `(user_b, currency)`. Backs the `Q(user_a=user)|Q(user_b=user), currency=viewer_currency` pattern used in `_combined_balance_rows` (`services.py:982-984`) and `scoped_balances` (`services.py:742-744`).
- **`Friendship`** (`apps/ledger/models.py:101-104`): add `(user_a, -created_at)` and `(user_b, -created_at)`. `FriendshipListView`'s default ordering (`apps/ledger/views.py:420-428`) is `-created_at` with no index to ride today.
- **`Expense`** (`apps/expenses/models.py`, near existing `(scope, -date)` indexes): add `(added_by, amount)`, `(friendship, amount)`, `(group, amount)`. Backs `sort=highest|lowest` (`apps/expenses/views.py:180-193`), which currently falls back to an in-memory filesort after the scope filter.
- **`Settlement`**: add `(friendship, amount)`, `(group, amount)` — same `sort=highest|lowest` feature, confirmed to exist on settlements too (`apps/expenses/views.py:670-684`, `_SettlementPagination.get_ordering`).

Not adding a `(user_a, user_b)` composite on `PairwiseBalance` for `ledgers_with()`'s exact-pair lookup (`services.py:1053-1055`) — already adequately served by the existing partial `UniqueConstraint`s on `(user_a, user_b, group, currency)`/`(user_a, user_b, friendship, currency)`, which are themselves indexes covering that column prefix.

**Fix**: one migration in `apps/expenses` (Phases 4 + 5's Expense/LedgerEntry/PairwiseBalance/Settlement changes together, since they're the same app) and one migration in `apps/ledger` (Friendship). Pure additive/subtractive index changes — no data migration, no query-shape change, safe to apply to the live Docker DB directly.

---

## Not included in this round — flagged for a follow-up decision

**Cross-currency wallet balance fallback recomputes from scratch on every request** (`apps/expenses/services.py:992-1027`, used by `wallet_summary`/`wallet_people`/`wallet_list`/`combined_balances` — every wallet-home load). For same-currency scopes this correctly reads the O(1) `PairwiseBalance` cache; for any scope whose currency differs from the viewer's own `default_currency`, it instead fetches and Python-sums *every* matching `LedgerEntry` the user has ever been party to, unbounded, on every request — the exact "always read PairwiseBalance, never raw-sum LedgerEntry" invariant the model's own docstring warns against, done anyway here for historically-accurate point-in-time currency conversion. The code comments call this "a rare fallback," but it's not rare for any user whose `default_currency` differs from every group/friendship they're in — for them it's 100% of their scopes, every time. The composite index in Phase 5 helps the query itself, but doesn't fix the "unbounded, uncached, grows with total history" shape. A real fix means either bounding/caching this specific computation or extending `PairwiseBalance`-style caching to cover cross-currency conversions — a genuine architecture decision (how to cache a per-currency-pair, point-in-time-sensitive value), not a mechanical fix, so I'm not folding it into this round. Worth a dedicated follow-up if cross-currency users are a meaningful share of your user base.

**Dashboard wallet queries' `staleTime: 0`** (`use-wallet-summary-query.ts:17`, `use-wallet-list-query.ts:34`) — `DashboardScreen` fully unmounts/remounts on bottom-nav navigation (`app-shell.tsx`'s `<Outlet>` behavior), so returning to Home always fires fresh requests, not just after real writes. This looks deliberate (existing code comments say so) — likely a "wallet balance must always be current, in case a push notification silently changed it elsewhere" choice. Not touching this without your input: bumping it to a small `staleTime` (e.g. 10-15s) would cut redundant refetches on quick tab-switching without materially hurting freshness (real writes already invalidate these queries explicitly), but it does relax a deliberate choice a previous developer made on purpose. Let me know if you want this changed too.

---

## Files touched

**Frontend**: `expense-item.tsx` consumers (5 files, Phase 1), `user-ledgers`-invalidating mutation hooks (7 files, Phase 2, group-expense ones left as-is with an explanatory comment).

**Backend**: `apps/expenses/serializers.py` (Phase 3), `apps/expenses/models.py` + new migration (Phases 4-5), `apps/ledger/models.py` + new migration (Phase 5).

## Verification

1. Frontend: `npx tsc --noEmit -p tsconfig.app.json` and `npx eslint` on every touched file (established pattern from prior work in this session). On-device: open a group/contact/personal expense list, confirm rows don't visibly flash/re-render on unrelated actions (e.g. opening a filter drawer); trigger a settlement/expense mutation and confirm the *relevant* contact's combined ledger view updates while an unrelated contact's cached view isn't silently refetched (can spot-check via React Query Devtools if available, or by observing network calls).
2. Backend: `uv run python manage.py makemigrations --check`, `uv run python manage.py check`, apply migrations to the running Docker backend (`docker compose exec web uv run python manage.py migrate`), confirm no errors. For the N+1 fix specifically: hit the recurring-expenses list endpoint with Django's query logging or a quick `django.db.connection.queries` count check (e.g. via `manage.py shell`) before/after to confirm the query count drops from ~100 to ~1 for a page of recurring expenses.
3. DB: after migrating, confirm the redundant indexes are actually gone and the new composite ones exist (`\di` in `psql`, or `django_migrations`/`information_schema.indexes` query) — cheap sanity check that the migration did what it says.
