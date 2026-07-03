# Lain Dain — Frontend Architecture Audit (v2)

**Scope:** `src/`, config, native shells. Excludes backend/auth/business logic (none exists yet).
**Stack:** React 19 · TanStack Router/Query · Zustand · Tailwind v4 · Capacitor 8
**Reviewed:** 158 `.tsx`/`.ts` files, 19,186 lines (up from 129 files / 18,808 lines at the last audit — growth from the fixes below, not scope creep).
**This is a re-audit.** The original audit (2026-07-03) produced a 15-item backlog; most of it has since been implemented. Every claim below was re-verified against the current code — `tsc`, `eslint`, a production build, and a live click-through — not carried over from memory.

---

## What changed since the last audit

| # | Item | Status |
|---|---|---|
| 1 | Fix Rules-of-Hooks bug in `group-detail-screen.tsx` | ✅ Done, verified (reproduced the crash on the old code via git stash, confirmed gone) |
| 2 | Replace 13MB splash GIF | ✅ Done — 1.2MB, same 700×700/100 frames, pixel-equivalent |
| 3 | Gate LAN dev-server URL | ⚠️ **Half-done — regressed, see Critical #1 below** |
| 4 | Unify contact/transaction data layer | ✅ Done (by a parallel effort) — real Zustand stores now canonical |
| 5 | App-level error boundary | ✅ Done — `defaultErrorComponent` wired, verified live with a real crash |
| 6 | Fix 2 setState-in-effect + hardcoded identity | ✅ Done — but **4-5 more instances of the same pattern found**, see High #2 |
| 7 | Code-split routes | ✅ Done — 1.5MB single bundle → 418KB eager + 84 lazy chunks |
| 8 | Consolidate domain types | ✅ Done — canonical `Contact`/`TransactionRecord`/`BalanceSummary` in `@/types`; found and fixed a second Rules-of-Hooks bug along the way |
| 9 | Migrate hex colors to tokens | 🟡 **~25% done** — `components/shared/*` migrated (6 new tokens, 412 replacements); `features/*/components/*` still has 588 raw hex values |
| 10 | Split `group-detail-screen.tsx` + `add-recurring-screen.tsx` | ✅ Done — 743→329 and 462→355 lines, each into 3-4 focused pieces |
| — | Dashboard infinite-loop crash (found during #4 verification) | ✅ Fixed — `useShallow` on the three derived selectors |
| 15 | Delete orphaned stub files | ✅ Done — 5 dead files + 1 dead constant removed |

**Net result:** ESLint went from 69 errors/11 warnings to **44 errors/3 warnings** (scoped correctly to `src/`, see Critical #2). Every previously-Critical item is resolved except one, which regressed after being fixed once — flagged below.

---

## 1. Project Architecture

The verdict from the last audit holds and is now on firmer ground: feature-folder organization, file-based routing with a single centralized auth guard, and drawers-over-URL-search-params for modal flows are all still the right calls at this scale, and nothing since has needed to move away from that shape. The real change is the data layer — it graduated from "mock arrays mutated in place" to actual Zustand stores with a canonical, centrally-defined domain model (`Contact`, `TransactionRecord`, `BalanceSummary` in `@/types`). That was the single structural weakness of the whole app, and it's fixed.

The new weak spot is narrower and more mechanical: two files never got the same attention as their siblings (`group-settings-screen.tsx` at 650 lines, `split-expense-drawer.tsx` at 574 lines — see §3), and the "reset local state when a drawer opens via an effect" anti-pattern that was fixed twice is still sitting in 6 other files that just never came up (§5). Neither is a design problem — they're finishing the same cleanup that's already 60% done elsewhere.

**Verdict: sound architecture, mop-up work remaining, not redesign work.**

---

## 2. Folder Structure

- `store/` is now the real, unambiguous home for domain state — `use-contact-store.ts`, `use-transaction-store.ts`, `use-recurring-store.ts`, `use-auth-store.ts`. This resolved the split-brain problem from the last audit cleanly.
- `features/groups/` gained `components/` and `hooks/` subfolders (`use-group-ledger.tsx`, `group-balance-carousel.tsx`, `group-category-expenses.tsx`, plus 3 more for the recurring form) — bringing it in line with every other feature, which already had this shape.
- `features/transactions/` no longer has empty stub files pretending to be unimplemented scaffolding — it now honestly contains exactly what's real: `transaction-detail-screen.tsx` and `components/receipt-preview-flow.tsx`.
- `src/hooks/` now has one real, shared hook (`use-formatted-amount-input.ts`) instead of two empty native-integration placeholders.
- **Still open:** `features/groups/data/group-members.ts`'s `GroupMember` and the *different*, larger `GroupMember` defined locally in `group-settings-screen.tsx` still share a name with two different shapes. I deliberately left this during the type-consolidation pass (they're genuinely different view-models for different screens, not the same concept twice) — still true, still worth a rename for clarity (e.g. `GroupSettingsMember`) as a trivial follow-up, not urgent.

---

## 3. Component Architecture

**`group-settings-screen.tsx` (650 lines) is now the single largest file in the app** — larger than `group-detail-screen.tsx` was before it got split, and it was never touched by any of the recent work. It owns member-list state, three destructive-action drawers, and a confirmation-sequencing ref pattern, in one file. This is the natural next candidate for exactly the same treatment `group-detail-screen.tsx` just got: extract the member-list data/actions into a hook, extract the confirmation-sequencing into its own hook (it's a genuinely tricky, self-contained piece of logic worth isolating), leave the JSX orchestration in the main file.

**`split-expense-drawer.tsx` (574 lines)** — still the second-largest file, still doing three split modes (equal/unequal/adjustment) as inline branches, still never split. It's also one of the six files with the `set-state-in-effect` pattern (§5) — a single pass here would fix both the size and the effect-anti-pattern at once, likely the best-value single file to tackle next.

**Well-judged, confirmed still correct:** the newly-extracted `group-balance-carousel.tsx`, `group-category-expenses.tsx`, `use-group-ledger.tsx`, and the recurring-form pieces are all right-sized (73-355 lines each), single-responsibility, and independently reviewable — exactly the outcome the split was for.

**New, well-judged reuse:** `useFormattedAmountInput` is now shared between `AddExpenseBase` and `AddRecurringScreen` — real logic dedup without forcing two genuinely different-looking forms into one component. Good precedent to repeat rather than force a bigger merge.

---

## 4. Code Quality

Rerunning lint scoped correctly to `src/**/*.{ts,tsx}` (see Critical #2 for why "correctly" matters) gives **44 errors, 3 warnings** — down from 69/11. What's left, categorized:

| Category | Count | Notes |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | 28 | Same long tail as before, spread thin across the app; not one fixable in isolation |
| `react-hooks/set-state-in-effect` | 6 | **All in `components/shared/*`** — `add-category-flow.tsx`, `add-note-flow.tsx`, `add-receipt-flow.tsx`, `paid-by-drawer.tsx`, `payment-method-drawer.tsx`, `select-date-drawer.tsx`, `split-expense-drawer.tsx`. Two established fix patterns already proven twice this cycle (key-based remount; lazy-init where the parent already remounts). This is now a known, mechanical, low-risk cleanup, not exploratory work. |
| `react-refresh/only-export-components` | 6 | 4 of these (`badge.tsx`, `button.tsx`, `combobox.tsx`, `tabs.tsx`) are shadcn primitives exporting a `cva` variants helper alongside the component — this is the **standard, universal shadcn convention** across the whole ecosystem. Fixing it would mean diverging from upstream shadcn's own file shape, making future `shadcn add` updates harder to reconcile. Recommend leaving these 4 alone; the other 2 (`category-picker.tsx`, `__root.tsx`) are still worth the 2-minute fix, as originally noted. |
| `react-hooks/immutability` | 1 | `personal/components/category-breakdown-card.tsx:43` — reassigns a variable during render to compute pie-slice angles. Never touched by any backlog item since nothing in `personal/` was in scope. Still a real, if minor, correctness smell. |
| `react-hooks/exhaustive-deps` | 2 | Both intentional (deliberately narrower deps than the linter wants, to avoid recomputing on irrelevant reference changes) — leave as-is. |
| `no-unused-vars` | 1 | `components/kibo-ui/status/index.tsx` — vendored third-party-sourced component, not house code. |

**4 stray `console.log` calls remain** (`personal/settings-screen.tsx`, `personal-screen.tsx`, `contact-detail-screen.tsx`, `group-detail-screen.tsx`) — all in placeholder action handlers ("Settle Up Confirmed"), same as before, harmless but worth sweeping in the same pass as the lint cleanup.

---

## 5. React Best Practices

**Two real Rules-of-Hooks bugs got fixed this cycle** (`group-detail-screen.tsx` from the original audit, and `contact-detail-screen.tsx`, found only because I was touching the file for an unrelated reason). Both used the identical shape: an early return between hook calls, both fixed with the identical pattern (move hooks above the guard). **No new instances found in this pass** — I checked.

**The `set-state-in-effect` anti-pattern is now the single most repeated issue in the codebase** — 6 confirmed instances, all in `components/shared/*`, all the same shape ("copy a prop into local temp state when a drawer opens"). This is worth calling out clearly: it's not 6 separate problems, it's one pattern that was fixed twice and should now just be applied everywhere else it appears, mechanically. Difficulty should be re-rated from "Medium" (first-time, exploratory) to "Low" (proven, repeatable) now that both fix shapes exist as working examples in the same codebase.

**The dashboard's selector-reference-instability bug is fixed** (`useShallow` on `selectReceivables`/`selectPayables`/`selectBalanceSummary`) — this was the most severe finding from the last audit's review of the parallel data-layer work (a genuine, 100%-reproducible crash on every single login), and it's now confirmed gone via a live before/after test.

---

## 6. TypeScript

`tsc -b --noEmit` is clean. The canonical-types work (§8 of the last audit) is the single biggest improvement here: `Contact`, `LedgerTag`, `TransactionRecord`, `BalanceSummary` now live in one file (`@/types/index.ts`), with the stores re-exporting them for backward compatibility rather than each store owning a competing definition. The dead duplicates (`dashboard/types.ts`, `dashboard/data/mock-data.ts`, `groups/data/recurring-store.ts`, the unused half of `contacts/types.ts`) are deleted, not just deprecated.

**Still open:** 28 `any` usages, unchanged in character from before — no single fix, just steady attrition as files get touched.

---

## 7. Styling

The token system gained 6 new tokens this cycle (`--positive`, `--positive-soft-bg`, `--divider`, `--muted-faint`, `--border-card`, `--hover-bg`) to cover colors that were used 60-116 times each with no matching token at all. `components/shared/*` (22 files, 412 individual replacements) is fully migrated and verified pixel-identical via before/after screenshot diffing.

**This is genuinely ~25% done, not fully done** — `features/*/components/*` still has **588 raw hex color occurrences**. This was explicitly scoped as a follow-up increment in the original work (the task itself said "do incrementally per-feature"), so this isn't a regression, it's the plan working as designed. The next natural slice is whichever feature you touch most often, or simply the highest-frequency remaining colors project-wide (same methodology as before: frequency-survey first, add only the tokens that are missing, leave one-off decorative colors alone).

---

## 8. Capacitor & Mobile Best Practices

### 🔴 Critical, regressed — the release-build safety net is disabled again

`capacitor.config.ts` itself is still correctly gated (`server.url` only added when `CAPACITOR_LIVE_RELOAD=true`). But `scripts/check-capacitor.js` — the prebuild script that's supposed to **fail the build** if that env var is left on — has both of its actual checks commented out:

```js
// 1. Check if CAPACITOR_LIVE_RELOAD is set to true in the build environment
// if (process.env.CAPACITOR_LIVE_RELOAD === 'true') { ... process.exit(1) }
// 2. Extra safety: Parse the file to ensure the server URL is not gated...
// if (content.includes('url:') && !content.includes('process.env.CAPACITOR_LIVE_RELOAD')) { ... }

console.log('✅ capacitor.config.ts check passed')
```

It unconditionally prints "passed" regardless of anything. I flagged this exact thing as disabled during a previous check; it has **not** been re-enabled since — someone disabled it again (or it was never actually turned back on), and `.env` locally still has `CAPACITOR_LIVE_RELOAD=true`. Re-enabling this is a 2-line uncomment; there's no reason for it to still be off.

### New, minor finding: ESLint scans native build artifacts

`eslint .` (no path scoping) picks up `ios/DerivedData/**/*.js` — vendored Capacitor Swift-package-manager JS bridge files that get generated locally by Xcode builds. This folder is correctly gitignored (`ios/.gitignore`), so it's not a repo hygiene problem and won't affect CI or a fresh clone — but it does inflate the local lint count for anyone who's built for iOS on their machine, and it's the reason "69 errors" vs "44 errors" depends entirely on which lint command you run. Two-line fix: add `'ios'`, `'android'` to `eslint.config.js`'s `globalIgnores`.

### Otherwise unchanged and still correct

Android `MainActivity.java`'s WebView text-zoom lock, the dual native/JS splash coordination, safe-area handling — all confirmed still in place, nothing regressed.

---

## 9. Scalability

The one blocker from the last audit — the mutable mock-data pattern that would cause real merge conflicts and silent runtime conflicts between developers — is resolved by the data-layer migration. What's left to hold up at "100 screens, 20 developers" is now genuinely mechanical, not structural: finish the color-token migration, finish the `set-state-in-effect` cleanup, split the two remaining oversized files. None of that requires a different shape than what's already in place.

---

## 10. Performance

Code-splitting confirmed still working in a fresh build: **418KB eager** (the shell + first route) instead of the original 1.54MB monolith, split into 85 chunks total, each route's chunk fetched only on first visit and cached thereafter (verified via network-request tracing across 8 different route transitions in the last cycle). No regressions found this pass.

---

## 11. Accessibility

Unchanged from the last audit — still no `eslint-plugin-jsx-a11y`, still no systematic sweep of interactive `<div onClick>` rows. Nothing regressed; nothing was in scope to improve this cycle either. Still the same 5-minute install + mechanical fix it was rated at before.

---

## 12. Developer Experience

Still no CI wiring (`.github/` is empty), still no test files anywhere. Both were rated Low priority last time specifically because nothing was actively broken by their absence — that's still true, but it's worth noting that **the CI gap is the reason the capacitor guard regression above wasn't caught automatically.** A `tsc && eslint` GitHub Action would have failed loudly the moment `check-capacitor.js` got its checks commented out. This is the strongest concrete argument yet for wiring it up — not hypothetical anymore, it's the direct explanation for how a real fix silently un-happened.

---

## 13. Production Readiness

| Item | Status | Note |
|---|---|---|
| Error boundaries | ✅ Present | `defaultErrorComponent` wired at the router level, verified against a real crash live in-browser |
| Crash logging | ✅ Present | `src/lib/log-error.ts`, console-based today with a clear seam for a real service later |
| Loading/empty states | Unchanged | Still no shared `EmptyState`, still not urgent (no async data yet) |
| Testing | Unchanged | Zero tests; `lib/split.ts` is still the best ROI target and still untested |
| Release-build safety | 🔴 Regressed | See Critical #1 |

---

## 14. Future Backend Integration

Meaningfully improved: the canonical types now living in `@/types` are exactly the shape §14 of the last audit asked for ("one `src/types/domain.ts` with the nouns every feature currently redefines"). TanStack Query is still installed, still wired, still unused — still the right bet to leave alone until there's a real endpoint to call.

---

## 15. File-by-File Review (files that changed materially since the last audit)

| File | What changed | Current state |
|---|---|---|
| `src/types/index.ts` | Gained `Contact`, `LedgerTag`, `TransactionRecord`, `BalanceSummary` | Canonical, single source of truth, re-exported by stores |
| `src/store/use-contact-store.ts` / `use-transaction-store.ts` | Now import types from `@/types` instead of defining them locally | Clean |
| `src/features/dashboard/dashboard-screen.tsx` | `useShallow` added to 3 selectors | Fixed the infinite-loop crash; confirmed clean live |
| `src/features/groups/group-detail-screen.tsx` | 743→329 lines | Split into hook + 2 components, all verified |
| `src/features/groups/add-recurring-screen.tsx` | 462→355 lines | Split into 3 components + shared amount-input hook |
| `src/features/groups/hooks/use-group-ledger.tsx` | New | Clean extraction, 1 pre-existing `any` unchanged from original |
| `src/components/shared/add-expense-base.tsx` | Now uses `useFormattedAmountInput`, tokens | Clean |
| `scripts/check-capacitor.js` | Checks commented out | **Needs re-enabling — see Critical #1** |
| `eslint.config.js` | Unchanged | Should gain `ios`/`android` ignores — see §8 |
| `src/features/transactions/*` | 3 empty stub files + 2 empty dirs deleted | Now honestly reflects what's actually implemented |
| `src/hooks/*` | 2 empty stubs deleted, 1 real hook added | Clean |
| `src/constants/routes.ts` | Dead `PROFILE` entry removed | Clean |

---

## 16. Engineering Scorecard

| Dimension | Score | Change | Why |
|---|---|---|---|
| Architecture | 8/10 | +1 | Data layer no longer the weak point |
| Folder structure | 8/10 | +1 | groups/ now matches every other feature's shape |
| Code quality | 7/10 | +1 | 69→44 errors; the remaining ones are a known, repeatable pattern, not scattered chaos |
| Maintainability | 7/10 | +1 | Two oversized files fixed; two more identified with a clear, proven playbook |
| Scalability | 7/10 | +1 | The one structural blocker (mutable data) is gone |
| Readability | 8/10 | — | Already strong, unchanged |
| Simplicity | 8/10 | — | Still no premature abstraction found anywhere in the new code either |
| TypeScript quality | 8/10 | +1 | Canonical types now real, not aspirational |
| React practices | 7/10 | +1 | Both hooks-order bugs fixed; effect-anti-pattern now well-understood and mechanical to finish |
| Mobile readiness | 6/10 | -1 | The capacitor guard regression is a real, concrete release risk that wasn't there conceptually before — it existed, got fixed, and un-fixed |
| Production readiness | 5/10 | +1 | Error boundary + crash logging now real; still no tests/CI |

**Read this as:** every score that depends on decisions already made (architecture, types, structure) went up, because that work is done and verified. The one score that went *down* is mobile readiness, specifically because a fix that existed got silently reverted — which is exactly the kind of regression a two-line CI check would catch automatically going forward.

---

## 17. Refactoring Roadmap

### Critical

**Re-enable the capacitor release-build guard**
- Problem: `scripts/check-capacitor.js` unconditionally passes; both real checks are commented out.
- Why it matters: `.env` currently has `CAPACITOR_LIVE_RELOAD=true` locally — nothing stops a release build from shipping with a LAN dev URL baked in.
- Files: `scripts/check-capacitor.js`
- Benefit: Restores the exact protection this file was built for
- Difficulty: Trivial (uncomment 2 blocks)
- Worth it: **Yes, do this first — it's a live regression of already-completed work**

**Scope ESLint away from native build directories**
- Problem: `eslint .` picks up vendored `ios/DerivedData/**` files, inflating error counts and confusing anyone who runs it after an Xcode build.
- Why it matters: Makes "how many lint errors do we have" an unreliable question depending on local build state.
- Files: `eslint.config.js`
- Benefit: Accurate, reproducible lint counts for everyone
- Difficulty: Trivial (2-line `globalIgnores` addition)
- Worth it: **Yes**

### High Priority

**Finish the `set-state-in-effect` cleanup across `components/shared/*`**
- Problem: 6 confirmed instances (`add-category-flow.tsx`, `add-note-flow.tsx`, `add-receipt-flow.tsx`, `paid-by-drawer.tsx`, `payment-method-drawer.tsx`, `select-date-drawer.tsx`, `split-expense-drawer.tsx`) of the same "sync temp state from props via effect" anti-pattern already fixed twice elsewhere.
- Why it matters: Same extra-render/stale-state risk as the original finding, now proven mechanical to fix (two working patterns already exist in this exact codebase).
- Files: the 6-7 listed above
- Benefit: Removes the single most-repeated remaining lint category
- Difficulty: Low (re-apply an already-proven pattern per file)
- Worth it: **Yes**

**Split `group-settings-screen.tsx` (now the largest file at 650 lines)**
- Problem: Same shape as the already-fixed `group-detail-screen.tsx` — member-list state, three destructive-action drawers, and a confirmation-sequencing ref pattern all in one file.
- Why it matters: It's now the single largest file in the app and was never part of the original split work.
- Files: `features/groups/group-settings-screen.tsx`
- Benefit: Same as the already-completed split — smaller, independently testable units
- Difficulty: Medium
- Worth it: **Yes**

**Wire lint + typecheck into CI**
- Problem: Nothing currently stops a regression like the capacitor-guard one from merging silently.
- Why it matters: This is no longer hypothetical — it's the literal explanation for how a completed fix got undone without anyone noticing.
- Files: new `.github/workflows/ci.yml`
- Benefit: Automatic regression prevention, demonstrated to be necessary by this exact audit
- Difficulty: Low (~10 min)
- Worth it: **Yes, this argument is now stronger than it was last audit**

### Medium Priority

**Split `split-expense-drawer.tsx` (574 lines, second-largest file)**
- Problem: Three split modes (equal/unequal/adjustment) as inline branches; also carries one of the `set-state-in-effect` instances.
- Why it matters: Doing this alongside the effect fix (High priority item above) is the same file, same visit — bundle them.
- Files: `components/shared/split-expense-drawer.tsx`
- Benefit: Smaller file, fixes 2 findings in one pass
- Difficulty: Medium
- Worth it: **Yes**

**Continue the color-token migration into `features/*/components/*`**
- Problem: 588 raw hex occurrences remain outside `components/shared/*`.
- Why it matters: Same "one-file rebrand" story as before — currently still needs ~80 files touched.
- Files: `features/*/components/*`
- Benefit: Completes what was explicitly scoped as an incremental, multi-pass effort
- Difficulty: Medium (mechanical, same proven methodology: survey frequency, add missing tokens, replace exact matches only)
- Worth it: **Yes, continue incrementally as already planned — don't do it all in one PR**

**Unit-test `lib/split.ts`**
- Problem: Still the single best test-ROI target in the app, still untested.
- Why it matters: Unchanged reasoning from the last audit — it's pure, financially load-bearing logic.
- Files: `src/lib/split.ts`
- Benefit: Regression safety on the one calculation users would actually notice being wrong
- Difficulty: Low
- Worth it: **Yes**

### Low Priority

**Add `eslint-plugin-jsx-a11y`**
- Unchanged from the last audit. Still a 5-minute install, still worth doing, still not urgent.

**Rename the colliding `GroupMember` in `group-settings-screen.tsx`**
- Problem: Two different shapes share one name across two files (`groups/data/group-members.ts` vs. the local one in `group-settings-screen.tsx`).
- Why it matters: Minor clarity issue, not a bug — confirmed deliberately different view-models, not a duplicate.
- Files: `features/groups/group-settings-screen.tsx`
- Benefit: Removes a naming collision that could confuse a future reader
- Difficulty: Trivial
- Worth it: **Yes, but genuinely low priority**

**Fix `personal/components/category-breakdown-card.tsx`'s render-time reassignment**
- Problem: `accumulatedPercent` reassigned during render to compute pie-slice angles.
- Why it matters: Same class of bug the Zustand migration fixed elsewhere; this one was never in scope.
- Files: `features/personal/components/category-breakdown-card.tsx`
- Benefit: Removes the last remaining `react-hooks/immutability` error
- Difficulty: Low
- Worth it: **Yes**

**Clean up 4 stray `console.log` calls**
- Unchanged in character from the last audit. Bundle with whichever lint-cleanup pass happens first.

> **Explicitly still rejected, unchanged reasoning:** a generated API client, a repository-class hierarchy, a generic form-builder over `AddExpenseBase`, `React.memo`/`useCallback` with no measured problem, forcing `AddRecurringScreen` through `AddExpenseBase` (confirmed, by direct comparison, to be genuinely different designs — not the same form twice), and collapsing the 4 shadcn `only-export-components` warnings (that's the correct upstream convention, not a bug).

---

## Summarized Backlog & Recommended Order

| # | Priority | Item | Files |
|---|---|---|---|
| 1 | 🔴 Critical | Re-enable the capacitor release-build guard | `scripts/check-capacitor.js` |
| 2 | 🔴 Critical | Scope ESLint away from `ios`/`android` | `eslint.config.js` |
| 3 | 🟠 High | Finish `set-state-in-effect` cleanup (6-7 files) | `components/shared/*` |
| 4 | 🟠 High | Split `group-settings-screen.tsx` | `features/groups/group-settings-screen.tsx` |
| 5 | 🟠 High | Wire lint + typecheck into CI | new `.github/workflows/` |
| 6 | 🟡 Medium | Split `split-expense-drawer.tsx` (bundle with #3's fix for this file) | `components/shared/split-expense-drawer.tsx` |
| 7 | 🟡 Medium | Continue color-token migration into `features/*/components/*` | ~80 files, incremental |
| 8 | 🟡 Medium | Unit test `lib/split.ts` | `src/lib/split.ts` |
| 9 | ⚪ Low | Add `eslint-plugin-jsx-a11y` | `eslint.config.js` |
| 10 | ⚪ Low | Rename colliding `GroupMember` | `group-settings-screen.tsx` |
| 11 | ⚪ Low | Fix `category-breakdown-card.tsx` render-time reassignment | `features/personal/components/category-breakdown-card.tsx` |
| 12 | ⚪ Low | Clean up stray `console.log` calls | 4 files |

Ready to work through these one at a time — say which number to start with, or "start from the top." Given #1 is a live regression of a fix that already existed once, I'd suggest starting there.

---
*Prepared 2026-07-03 (re-audit) — scope: frontend only, no backend criticism.*
