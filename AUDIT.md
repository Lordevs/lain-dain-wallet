# Lain Dain — Frontend Architecture Audit

**Scope:** `src/`, config, native shells. Excludes backend/auth/business logic (none exists yet).
**Stack:** React 19 · TanStack Router/Query · Zustand · Tailwind v4 · Capacitor 8
**Reviewed:** 129 `.tsx`/`.ts` files, 18,808 lines. Verified against `eslint .` and `tsc -b --noEmit` output, not impressions.

---

## Executive Summary

The UI layer of this app is genuinely good — the shared-component system (`FlowHeader`, `AddExpenseBase`, `ExpenseItem`, the drawer-based navigation pattern) shows real design discipline, and recent commits show the team already noticing and fixing exactly the right things (consolidating split math, standardizing drawers). That instinct is the most valuable thing here — better than any framework choice.

But three things need attention before this scales past a prototype:

1. A real, confirmed React bug in the largest screen in the app.
2. A "split-brain" data layer where the same domain object (a contact, a transaction) is mutated in place from four or five different screens with no single source of truth.
3. A handful of production-hygiene gaps (a 13 MB GIF shipped on every cold start, a LAN IP committed to the native config, zero error boundaries) that are cheap to fix now and expensive to fix later.

None of this calls for a rewrite or an enterprise layer. The fixes below are almost all *subtractive or corrective* — fix a hook order, promote one mock module to a store, delete a duplicate model — not new abstraction.

---

## 1. Project Architecture

Feature-folder organization (`src/features/<domain>`) with a thin shared layer (`components/shared`, `lib`, `store`) is the right call for a solo/small-team mobile app — it keeps related UI, hooks, and types physically close, and it's the same shape you'd want at 100 screens, not something you'd need to migrate away from. Routing is file-based via TanStack Router with the auth guard centralized in a single place (`src/routes/__root.tsx`) — that's exactly right, and the drawer-over-URL-search-params pattern for modal flows (`?drawer=add-expense`) is a genuinely good decision: it gives you deep-linkable, back-button-correct modals without a routing explosion.

The architectural risk isn't the folder shape, it's what's *inside* the shared layer: **the data layer never made the jump from "mock JSON for a demo" to "the shape the real app will have."** `src/features/dashboard/data/mock-data.ts` is imported and mutated directly by contacts, groups, and transactions — three unrelated features reach into one feature's internal data folder and write to it. That's not a folder-structure problem, it's a missing-abstraction problem: there is no `useContacts()`/`useLedger()` hook standing between screens and data, so every screen is coupled to the mock's exact shape and mutation style. When a backend arrives, every one of those call sites has to change, not just one repository module.

**Verdict: sound skeleton, hollow data layer**

---

## 2. Folder Structure

- **Consistent, no complaints:** `components/ui` (shadcn primitives), `components/layout`, `constants`, `assets`.
- **Two contact data models that should be one.** `features/contacts/data/mock-data.ts` exports `MOCK_CONTACTS: AppContact[]` — but it's *only* consumed by `features/contacts/hooks/use-new-contact-flow.ts`. Every other screen (dashboard, contact detail, group detail, transactions, notifications) uses the parallel, differently-shaped `ContactLedger` model from `features/dashboard/data/mock-data.ts`. Two "contact" types (`AppContact` vs `ContactLedger`) living in two features is a real duplicate-folder problem — the "new contact" wizard is quietly building an object that the rest of the app can't read.
- **A second parallel member list.** `features/groups/data/group-members.ts` (`MOCK_GROUP_MEMBERS`) exists purely for the recurring-payments screen, while `components/shared/split-expense-drawer.tsx` hardcodes its own inline member list for the exact same "who's in this group" concept. Two sources for one concept, again.
- **`features/transactions/` is a feature in name only.** `types.ts`, `schemas/transaction.schema.ts`, and `hooks/useTransactions.ts` are empty TODO files; the actual transaction record type and CRUD logic live inside `features/contacts/data/transaction-store.ts` instead. Anyone looking for "where do transactions live" will check the transactions folder first and find nothing.
- **`src/hooks/` is two empty stub files** (`useCapacitor.ts`, `useHaptics.ts`) — fine as a marker of intent, but they currently produce zero value and should either be implemented alongside the native-plugin work in §8, or deleted until they are.
- **Types are scattered, not centralized** — every feature has its own `types.ts`, and `src/types/index.ts` holds only currency types. That's a reasonable default for feature isolation, but three of the core cross-feature concepts (a person, a transaction, money owed) currently have no single canonical definition anywhere (see §6).
- **Orphaned constant:** `src/constants/routes.ts` defines `ROUTES.PROFILE = '/profile'` with no matching route file — dead reference, safe to delete.

None of this needs new top-level folders or a "domain layer" — it needs the two duplicate data sources merged and the transactions feature's real logic moved into its own folder. That's consolidation, not restructuring.

---

## 3. Component Architecture

### Too large, should split

| File | Lines | Why it's doing too much |
|---|---|---|
| `features/groups/group-detail-screen.tsx` | 743 | Owns carousel animation state, category filtering, balance computation, three drawer flows (reminder/add/edit), and a full transaction-detail overlay — all in one component. Also the file with the confirmed hooks bug (§4). |
| `features/groups/group-settings-screen.tsx` | 645 | Member list state, three destructive-action drawers, and a sequencing ref pattern all in one file — the sequencing logic (§5) is genuinely tricky and deserves its own hook, separate from the render tree. |
| `components/shared/split-expense-drawer.tsx` | 570 | Three split modes (equal/unequal/adjustment) each with their own layout, validation, and math live as inline branches in one component. |
| `features/notifications/components/settle-up-panel.tsx` | 530 | Handles both `mode: 'group'` and `mode: 'contact'` end-to-end inside one component via branching, rather than two thin components sharing an inner form. |
| `features/groups/add-recurring-screen.tsx` | 477 | Duplicates most of AddExpenseBase's form fields instead of reusing it. |

**Recommended split for `group-detail-screen.tsx` specifically** (highest value, since it's also the buggiest): extract the balance/category computation (lines ~170–230) into a `useGroupLedger(id)` hook, extract the two-card carousel into its own presentational component, and let the screen itself just compose them. That turns one 743-line file with a real bug into three small, independently testable pieces — not "architecture for its own sake," just breaking up a component that outgrew itself.

### Duplicate UI that should consolidate

- **`add-recurring-screen.tsx` re-implements the expense form** instead of reusing `components/shared/add-expense-base.tsx`, which already handles amount input, category, date, and validation. This is the one place in the app where the team's own "consolidate shared logic" instinct (visible in the `lib/split.ts` commit) didn't get applied — worth doing the same pass here.
- **Confirmation math is inlined multiple times** instead of using `lib/split.ts`'s helper for read paths — recurring payments and the settle-up panel each recompute "who owes what" locally rather than calling the shared helper.

### Missing reusable component

There is no shared "empty state" or "loading state" component (see §13) despite the design system otherwise being disciplined — every list (expenses, notifications, contacts) would benefit from one `EmptyState` component the way they already share `ExpenseItem` and `FlowHeader`.

### Well-judged, don't touch

`flow-header.tsx`, `expense-item.tsx`/`expense-list.tsx`, and `add-expense-base.tsx`'s `showPaidByAndSplit` boolean-prop branch are all right-sized: one clear prop controlling one clear variant, reused across five+ screens. This is the "boring, correct" reusable-component design the rest of the codebase should imitate — resist the urge to split these further.

> **Explicitly not recommended:** do not extract a generic `<Drawer>` wrapper-of-a-wrapper around vaul, and do not build a generic `<Form>` abstraction over `AddExpenseBase`. There's only one real form shape in this app; a generic form builder would add a config-object indirection layer for zero current benefit.

---

## 4. Code Quality

`npx eslint .` currently reports **69 errors and 11 warnings** — that number matters less than what's in it:

- **A real, confirmed Rules-of-Hooks violation** — see §5, this is the top code-quality item in the whole audit.
- **26 uses of `any`** (`@typescript-eslint/no-explicit-any`) spread across `recurring-payments-screen.tsx`, `notifications-screen.tsx`, `category-picker.tsx`, `transaction-detail-screen.tsx`, and more — each one is a spot where TypeScript's strict mode (correctly enabled in `tsconfig.app.json`) is being silently defeated.
- **One unused variable** (`transaction-detail-screen.tsx:41`, unused catch-clause `e`) and **one dead assignment** (`group-detail-screen.tsx:550`, `targetId` assigned and never read).
- **Two files break Fast Refresh** by exporting non-component values alongside a component: `personal/components/category-picker.tsx` exports the `CATEGORIES` constant from the same file as the `CategoryPicker` component, and `routes/__root.tsx` exports `Route` alongside `RootComponent`. Small fix, real dev-loop cost (full reload instead of hot reload on every edit to either file).
- **Magic literals standing in for real IDs:** `group-detail-screen.tsx:233` branches on `if (id === '5')` to decide whether to show mock balance data — a hardcoded group ID with app behavior branching on it. `use-recurring-store.ts` similarly seeds data keyed to group `'5'`. Fine for a demo seed, but should not survive as an `if` branch in production code — it belongs in the mock data file, not the component logic.
- **Hardcoded identity:** `add-expense-base.tsx` (~lines 230–245) hardcodes the current user's initials as the literal string `"MH"` in the "paid by you" avatar, instead of reading `userProfile` from `store/use-auth-store.ts` — the one real global store in the app isn't even wired into the app's own shared expense form.
- **Display-string parsing as business logic:** the settle-up/confirmation panels in `features/notifications/` use regex against rendered `title`/`subtitle` strings to recover amounts and names, rather than storing those as structured fields on `NotificationItem`. It works today because the mock strings are hand-written to match the regex, but it's a landmine for the next contributor who changes a notification's copy.
- **4 stray `console.*` calls** left in application code — harmless individually, but there's no lint rule stopping the count from growing (see §12).

---

## 5. React Best Practices

### 🔴 Critical — confirmed Rules of Hooks violation

In `features/groups/group-detail-screen.tsx`, the component returns early at **lines 146–158** ("Group not found") *before* six hook calls that appear afterward — `useState` at lines 161, 164, 167, 168 and `useMemo` at lines 171, 174, 209, 232. ESLint's `react-hooks/rules-of-hooks` flags every one of them. Concretely: navigate from a valid group straight to `/groups/does-not-exist` (or have the mock lookup miss for any reason) and back — the hook count changes between renders and React will either throw *"Rendered fewer hooks than expected"* or silently corrupt state.

**Fix: move the six hook calls above the early return.** This is a five-minute fix with outsized payoff — it's the single highest-value correctness fix in this entire audit.

### State-in-effect anti-pattern (2 instances)

`features/dashboard/components/sort-filter-drawer.tsx:41-46` and `features/groups/add-recurring-screen.tsx:63-68` both call `setState` synchronously inside a `useEffect` to sync "temp" drawer state from props when the drawer opens. Both flagged by React's own effect-hygiene lint rule. The idiomatic fix for "reset local state whenever a drawer opens" is a `key` prop on the drawer's inner content (remount instead of resync) — cheaper, and removes the extra render caused by the effect firing after mount.

### Mutation of external state during render/handlers

The newer React Compiler ESLint rules caught several places where a value used in JSX is mutated directly rather than via `setState`: `features/personal/components/category-breakdown-card.tsx:43` reassigns an outer `accumulatedPercent` variable *during render* to compute pie-slice angles; `add-group-expense-screen.tsx`, `edit-group-expense-screen.tsx`, and `transaction-detail-screen.tsx` all mutate the imported mock `contact`/`txList` objects directly inside event handlers that are also referenced from JSX props. None of these have caused a visible bug yet only because the app forces a full remount on every drawer close (noted directly in the codebase's own `store/use-transaction-store.ts` comment) — but that remount-as-a-workaround *is* the smell. The real fix is §1's data-layer fix: once mutations go through a Zustand store's `set()`, this whole class of lint error disappears on its own.

### Composition & hooks — otherwise solid

`useMemo` is used sensibly 27 times for real derived-data computation (grouping transactions by date, computing category summaries); there's no smell of memoizing trivial values. `useNewContactFlow` and `useNotifications` both correctly extract multi-step state machines out of their screens into hooks — good instinct, keep doing it for the group-detail split recommended in §3.

One structural nit worth knowing about rather than urgently fixing: `features/notifications/hooks/use-notifications.ts` backs its `useState` with a module-level mutable variable (`let _notifications`, line 7) so state "survives" remounts without a real store. It works for a single notifications screen, but if this hook is ever called from two places at once, they won't stay in sync with each other. Low risk today since there's exactly one consumer — flag it as a "promote to Zustand when a second consumer appears," not an urgent fix.

---

## 6. TypeScript

`tsconfig.app.json` is configured well — `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` are all on, and `tsc -b --noEmit` currently passes clean with zero errors. That's a genuinely strong baseline most prototypes don't bother with.

The gap isn't the compiler config, it's that 26 `any`s (§4) opt individual call sites back out of it, and that the domain types are fragmented rather than missing: `ContactLedger` (dashboard), `AppContact` (contacts), `TransactionRecord` (contacts/data), `GroupMember` (groups/data) each model overlapping real-world concepts (a person, a money movement) with no shared interface between them. This isn't "add generics" territory — it's "write down the four or five domain nouns once, in one file, and have every feature import them," which is simplification, not new abstraction.

- **No canonical `Transaction`/`Expense` type** despite it being the single most important domain concept in an expense-splitting app — the closest thing is `TransactionRecord` in a data file, not a types file.
- **No canonical `User` type** beyond `UserProfile` in the auth store — reasonable for now, but will need to unify with `ContactLedger`'s shape once "you" and "a contact" need to be the same type.

**Verdict: strong compiler settings, fragmented domain model**

---

## 7. Styling

`src/index.css` defines a genuinely complete design-token system — brand colors, radii scale, custom shadows, all exposed through Tailwind's `@theme inline` so they're usable as `bg-primary`, `text-secondary`, etc. That part is done right.

The problem is that almost nothing in the actual screens uses those tokens. Every file read for this audit — `expense-item.tsx`, `add-expense-base.tsx`, `group-detail-screen.tsx` and others — reaches for raw Tailwind arbitrary values instead: `text-[#0B683A]`, `bg-[#FFF9E6]`, `border-[#EBEBEB]`, dozens of times per file, when the token system already defines `--primary: #01592B` and friends. The practical risk: rebrand the app's green, and you have to grep-and-replace across 129 files instead of editing one CSS variable — which defeats the entire point of having a token system. Worth a real (if mechanical) cleanup pass, feature by feature, not a rewrite.

Also worth a two-minute fix: `index.css:42` sets `background: #FEF5EE` on `:root` directly (labeled "desktop preview" in a comment) while `--background` a few lines later is `#FEFAF1` — two near-identical creams defined in the same block is confusing for the next person who edits this file.

The two mobile-specific CSS fixes — locking input/textarea font-size to `max(16px, 1em)` to stop iOS auto-zoom, and `text-size-adjust: 100%` paired with the Android `MainActivity.java` `setTextZoom(100)` fix — are exactly the right, well-targeted fixes for real WebView bugs. Good work, no notes.

---

## 8. Capacitor & Mobile Best Practices

### 🔴 Critical — live dev server URL committed to native config

`capacitor.config.ts:22-25` hardcodes `server.url: 'http://192.168.1.19:5173'` with `cleartext: true`. If a release build is ever cut without manually deleting this block, the shipped app will try to load the web bundle from a developer's home-network IP instead of the bundled `dist/` assets — it will show a blank/broken screen for every real user. The README already flags this as a manual step, which is the actual gap: a manual "don't forget to delete this" step is exactly the kind of thing that survives past the person who wrote it. Gate it behind an env var or a build script that strips the `server` block instead of a comment.

- **Splash screen handled twice, deliberately** — native `SplashScreen` is configured for instant auto-hide, and a custom JS splash overlay in `__root.tsx` handles the actual visible delay. Reasonable pattern, avoids the native/JS splash flicker some Capacitor apps have.
- **Android text-zoom lock is a real, well-targeted native fix** — `android/app/.../MainActivity.java` forcing `setTextZoom(100)` on create and resume, paired with the CSS-side fix in §7. Exactly the kind of native/web coordination a Capacitor app should have and most don't bother with.
- **`useCapacitor.ts` and `useHaptics.ts` are empty stubs** — no platform-detection hook exists yet, so any future "only do X on native" logic has nowhere to go. Not urgent (nothing needs it yet), but worth implementing as a thin wrapper the day the first native-only feature (haptics on settle-up, share-sheet on receipts) is built — don't build it speculatively before then.
- **No offline story** — reasonable, since there's no backend yet; flagging only so it's on the list for when one exists (see §14).
- Safe-area handling (`viewport-fit=cover`, `env(safe-area-inset-bottom)`) is present and used correctly in the sticky action bars that need it.

---

## 9. Scalability — 100 screens, 20 developers, thousands of users

**Would the folder/routing shape hold at 100 screens?** Yes, largely unchanged. File-based routing plus feature folders is exactly the shape that scales by addition — a new feature is a new folder, not a refactor of an existing one.

**Would 20 developers be able to work in this without stepping on each other?** Not yet — and not because of file structure. The blocker is the mutable mock-data pattern (§1): if five features all import and mutate the same module-level array, two developers touching different features can create merge conflicts and, worse, silent runtime conflicts that have nothing to do with git. That resolves the moment the data layer moves into a proper store (or real API + TanStack Query, which is already installed and wired but entirely unused — see §14).

**Would it hold at thousands of daily users?** That's almost entirely a backend/infra question outside this audit's scope, but the frontend-side risks are the ones in §10 and §13: a 1.5 MB single JS bundle with zero code-splitting, and zero error boundaries, both get more expensive to retrofit the longer they're deferred.

**Verdict: shape scales, data layer doesn't — yet**

---

## 10. Performance

### 🔴 13 MB GIF shipped on every cold start

`src/assets/coin.gif` is **13,392,533 bytes** and is loaded from `src/routes/__root.tsx` as part of the splash animation shown on *every single app launch*. Built output confirms it: `dist/assets/coin-CnVdpJGH.gif` is 13.4 MB out of a ~15.7 MB total asset folder — this one file is ~85% of everything the app ships. On a real device over cellular, this is a multi-second, real-money-in-data-cost delay before the app is even usable. Replace with a Lottie/CSS animation or an optimized short MP4/WebP — should be well under 500 KB for the same visual effect.

- **No code-splitting anywhere** — zero uses of `React.lazy` or `<Suspense>` in the codebase, confirmed by grep. `routeTree.gen.ts` wires ~20 top-level routes into one `index-DxMPyUF9.js` bundle (1.54 MB). At today's screen count this is survivable; it stops being survivable well before "100 screens." The fix is small and additive: swap route-level imports to `createLazyFileRoute` (TanStack Router's built-in code-splitting primitive) — no new tooling required.
- **Two more oversized static assets:** `receipt_mockup.png` (998 KB) and `smart-settle.png` (187 KB) — both compressible by 70-90% with no visible quality loss.
- **Zero `React.memo`/`useCallback` anywhere in the app** — worth naming explicitly: *this is not a problem to fix.* With no measured jank and no evidence of expensive re-render chains, adding memoization now would be the "architecture for its own sake" this audit is explicitly avoiding. Revisit only if profiling on a real device shows a specific list or animation dropping frames.

---

## 11. Accessibility

27 of 129 files use an `aria-*` attribute — accessibility exists, but ad hoc rather than systemic, and there's no `eslint-plugin-jsx-a11y` in `eslint.config.js` to catch regressions.

- Interactive rows built as `<div onClick>` (e.g. `expense-item.tsx:84-90`) rather than `<button>` — not keyboard-focusable, not announced as interactive by screen readers, no visible focus ring. This is the single highest-leverage a11y fix: swap the wrapping element to a real `<button>` (or add `role="button" tabIndex={0}` + key handler as a fallback) everywhere a list row is clickable.
- Touch targets are generally good — most primary actions use `h-14`/`size-6`+ hit areas well above the 44px mobile minimum.
- Color is doing real communication work (green = receivable, orange = payable) with no accompanying text/icon differentiator in a few list contexts — worth a pass to confirm every color-coded amount also has a textual cue for color-blind users, since the design system already has the icons available.

Recommendation: add `eslint-plugin-jsx-a11y` to the flat config now — a five-minute install that catches the interactive-div pattern automatically on every future PR, more durable than a one-time manual sweep.

---

## 12. Developer Experience

- **Path aliasing is set up correctly and consistently** — `@/*` resolves in both `vite.config.ts` and `tsconfig.app.json`, and every file read for this audit used it rather than relative-path spaghetti. No notes.
- **`components.json`** (shadcn config) is a nice touch for discoverability — new UI primitives can be pulled via the CLI from the configured `@reui`/`@kibo-ui` registries rather than hand-copied.
- **No environment configuration exists** — reasonable today (no backend to point at), but the LAN-IP problem in §8 is a preview of what happens without one: there's no `.env`/`import.meta.env.VITE_*` convention yet for the inevitable "API base URL" that's coming. Worth setting up the convention now, before the first real fetch call.
- **No pre-commit hook / CI running lint or typecheck** — the 69 lint errors and the hooks bug in this audit would all have been caught automatically if `eslint` ran on push. This is the single highest-leverage DX investment available: a basic GitHub Actions job running `tsc -b --noEmit && eslint .` costs about ten minutes to set up.
- **No tests exist at all** — expected at this stage and not a complaint on its own (see §13 for what's actually worth testing first).

---

## 13. Production Readiness

| Item | Status | Note |
|---|---|---|
| Error boundaries | ❌ Missing | Zero found. One uncaught render error anywhere currently takes down the entire app to a white screen. Add one boundary at the app shell level today. |
| Loading states | ⚪ N/A today | Nothing to load yet since there's no async data — but no established pattern either, which matters the day `useQuery` gets its first real call. |
| Empty states | ⚠️ Inconsistent | No shared `EmptyState` component (§3) — some lists handle "nothing here" ad hoc, others don't handle it at all. |
| Skeletons | ⚪ None | Not urgent while all data is synchronous mock data. |
| Logging / crash reporting | ❌ Missing | No Sentry/Bugsnag-equivalent hook. Combined with zero error boundaries, a crash in production today is invisible to the team. |
| Analytics hooks | ⚪ None | Reasonable to defer until product metrics are actually needed. |
| Input validation | ✅ Present | `react-hook-form` + `zod` resolvers correctly wired in the auth profile form; good pattern to extend to other forms. |
| Testing | ⚠️ None | Zero test files anywhere. `lib/split.ts`'s split-math is pure, already-consolidated, and financially load-bearing — the single best unit-testing ROI in the app and currently has zero tests. |

---

## 14. Future Backend Integration

The good news: TanStack Query is already installed and correctly wired into `main.tsx`'s provider tree — the plumbing for a real API layer exists and works, it's just never called. That's a good bet already placed, not a gap to fill.

The real prerequisite is §1/§6 combined: before wiring up `useQuery`, the app needs (a) one canonical `Transaction`/`Contact`/`Group` type per concept instead of the current 3-4 overlapping shapes, and (b) mutations routed through a single place per concept (a Zustand store today, a mutation hook tomorrow) instead of screens reaching into a mock module and mutating it directly. Both of those are exactly the same fix already needed for correctness (§5) and scalability (§9) — this isn't a separate body of work, it's the same fix paying off a third time.

Concrete suggested shape, sized for this app (not an enterprise layer):

- One `src/types/domain.ts` (or similar) with `Transaction`, `Contact`, `Group`, `Balance` — the nouns every feature currently redefines.
- A thin `src/lib/api.ts` fetch wrapper (base URL from `import.meta.env.VITE_API_URL`) — one file, not a generated client, not a service-per-entity abstraction.
- `useQuery`/`useMutation` hooks per feature (`features/contacts/hooks/useContacts.ts` already has the right filename waiting, just no body) replacing direct mock-array reads.

> **Explicitly not recommended:** do not introduce a generated OpenAPI client, a repository-pattern class hierarchy, or a DTO-mapping layer before there's a real backend to react to. Any of those, chosen now, would be guessing at a shape the actual API will dictate — cheaper to write the thin version once the contract is real.

---

## 15. File-by-File Review

*(Covering the files that most shape how the app is built and maintained. 129 files total; the remainder are straightforward leaf components consistent with the patterns noted here.)*

### Core config & entry

| File | Purpose | Quality | Action |
|---|---|---|---|
| `vite.config.ts` | Build config, alias, router codegen | Clean, minimal, correct | None |
| `capacitor.config.ts` | Native shell config | Committed LAN dev URL (§8) | Gate `server` block behind env/build flag |
| `tsconfig.app.json` | Compiler options | Strict, well-chosen flags | None |
| `eslint.config.js` | Lint rules | Good baseline, missing a11y plugin | Add `eslint-plugin-jsx-a11y`; wire into CI |
| `src/main.tsx` | App bootstrap, providers | Clean | None |
| `src/App.tsx` | Renders DashboardScreen for `/` | Trivial, comment explains why | None |
| `src/routes/__root.tsx` | Auth guard + app shell + splash | Good centralized guard; breaks fast-refresh (§4) | Move non-component export out |
| `src/index.css` | Design tokens + Tailwind theme | Complete token system, underused (§7) | Migrate components to token classes; fix duplicate background decl |

### State & data

| File | Purpose | Quality | Action |
|---|---|---|---|
| `store/use-auth-store.ts` | Auth/profile state | Clean Zustand, but no persistence — logout on every reload | Add `persist()` once acceptable |
| `store/use-recurring-store.ts` | Recurring payments state | Correct, reactive, well-scoped | Use as the template for promoting other mock data |
| `store/use-transaction-store.ts` | Empty — design note only | Honest, well-written TODO documenting the split-brain problem | Implement per §1/§14; delete the note once done |
| `store/use-contact-store.ts` | Empty — design note only | Same as above | Same as above |
| `features/dashboard/data/mock-data.ts` | De facto app-wide contact/group source | Mutated by 5+ unrelated features directly | Wrap in a store; highest-priority data fix |
| `features/contacts/data/mock-data.ts` | Second, mostly-unused contact model | Only consumed by the new-contact wizard | Merge into `ContactLedger` or delete |
| `features/contacts/data/transaction-store.ts` | The real transaction log (despite the name suggesting "contacts") | Functionally fine, badly located | Move into `features/transactions/` |
| `lib/split.ts` | Split-amount calculation | Well-consolidated, pure, readable | Add unit tests — highest-ROI test target in the app |
| `lib/currency.ts` | Currency formatting | Clean, handles PKR special-case sensibly | None |
| `hooks/useCapacitor.ts`, `useHaptics.ts` | Placeholder native hooks | Empty TODOs | Implement alongside first native feature, or delete until then |

### Shared design system

| File | Purpose | Quality | Action |
|---|---|---|---|
| `components/shared/add-expense-base.tsx` | The one shared expense form | Well-parameterized via a single boolean prop; hardcodes "you" as "MH" (§4) | Read initials from `useAuthStore` |
| `components/shared/flow-header.tsx` | Unified top bar, used almost everywhere | Right-sized, high reuse, no notes | None |
| `components/shared/expense-item.tsx` / `expense-list.tsx` | Canonical transaction row | Clean, well-typed, good prop surface | Swap the raw `<div onClick>` row for a `<button>` (§11) |
| `components/shared/split-expense-drawer.tsx` | Split configuration UI | Functionally solid, oversized (§3) | Split equal/unequal/adjustment into sub-components |
| `components/shared/confirm-action-drawer.tsx` + `outstanding-balance-drawer.tsx` | Destructive-action confirmation chain | The `pendingAfterClose` ref-sequencing pattern is a genuinely good avoidance of `setTimeout` hacks | None — good pattern, reuse it elsewhere |
| `components/ui/*` | shadcn primitives | Standard, consistent, unmodified from source | None |

### Largest / highest-risk screens

| File | Purpose | Quality | Action |
|---|---|---|---|
| `features/groups/group-detail-screen.tsx` | Group ledger + balances + drawers | Confirmed hooks-order bug (§5); otherwise capable | Fix hook order now; split per §3 next |
| `features/groups/group-settings-screen.tsx` | Member management | Correctly avoids mutating shared mock state (explicit local state, noted in its own comments) — better discipline than its siblings | Extract the confirmation-sequencing logic into a hook |
| `features/notifications/hooks/use-notifications.ts` | Notification state | Module-level mutable variable backing useState (§5); handler bodies hardcode fake completion text regardless of which notification was acted on | Promote to Zustand when a second consumer appears; make completion text derive from the actual notification |
| `features/transactions/transaction-detail-screen.tsx` | Transaction detail + delete | Linearly scans the entire mock store to find one transaction; mutates `contact` directly from a JSX-referenced handler | Fixed by the same data-layer change as everywhere else |
| `features/auth/components/auth-screen.tsx` | OTP auth flow | Clean state machine, good use of framer-motion for step transitions; OTP verification is a no-op by design (no backend yet) | None until backend exists |

---

## 16. Engineering Scorecard

| Dimension | Score | Why |
|---|---|---|
| Architecture | 7/10 | Right shape, wrong data layer |
| Folder structure | 7/10 | Consistent, minus 2 duplicate data sources |
| Code quality | 6/10 | 69 lint errors incl. one real bug |
| Maintainability | 6/10 | Great shared components, split-brain data |
| Scalability | 6/10 | Holds at 100 screens, not at 20 devs yet |
| Readability | 8/10 | Consistent naming, clear file layout |
| Simplicity | 8/10 | No premature abstraction found — a real strength |
| TypeScript quality | 7/10 | Strict config, fragmented domain types |
| React practices | 6/10 | One rules-of-hooks bug drags this down |
| Mobile readiness | 7/10 | Good native fixes, one shipped 13MB asset |
| Production readiness | 4/10 | No error boundaries, logging, or tests yet |

Read this as: **the parts a designer/frontend engineer controls day-to-day (readability, simplicity, component design) are the strongest scores here** — that's the team's actual skill showing. **The parts that only show up under load or over time (production readiness, scalability, React correctness) are the weakest** — exactly what you'd expect from a UI-first prototype that hasn't yet been pushed by real users or a second developer. Nothing here reflects a bad instinct; it reflects things that are invisible until you go looking for them, which is the actual job of this audit.

---

## 17. Refactoring Roadmap

### Critical

**Fix Rules-of-Hooks violation in group-detail-screen**
- Problem: Six hooks called after an early return; hook count changes between renders.
- Why it matters: Can crash the app or silently corrupt state when navigating to/from an invalid group id.
- Files: `features/groups/group-detail-screen.tsx:146-232`
- Benefit: Removes a live crash risk
- Difficulty: Trivial (~15 min)
- Worth it: **Yes — do this first, today**

**Replace the 13MB splash GIF**
- Problem: `coin.gif` is 13.4MB and loads on every cold start, ~85% of total shipped assets.
- Why it matters: Real cellular-data cost and multi-second delay for every user on every launch.
- Files: `src/assets/coin.gif`, `src/routes/__root.tsx`
- Benefit: ~13MB smaller app, faster cold start
- Difficulty: Low (re-export as Lottie/WebP/MP4)
- Worth it: **Yes — highest performance ROI available**

**Gate the committed LAN dev-server URL**
- Problem: `capacitor.config.ts` points release builds at a developer's LAN IP unless manually removed.
- Why it matters: A forgotten manual step ships a broken app to real users.
- Files: `capacitor.config.ts:22-25`
- Benefit: Removes a whole class of "forgot to revert" release incidents
- Difficulty: Low (env var + build script check)
- Worth it: **Yes**

### High Priority

**Unify the contact/transaction data layer**
- Problem: Mock arrays mutated in place from 5+ features; two parallel contact models; two parallel member lists.
- Why it matters: Root cause of the render-time mutation lint errors, the split-brain re-render workaround, and the biggest blocker to both multi-developer work and a future API integration.
- Files: `features/dashboard/data/mock-data.ts`, `features/contacts/data/*`, `store/use-transaction-store.ts`, `store/use-contact-store.ts`
- Benefit: One source of truth; unblocks §14 backend work for free
- Difficulty: Medium (mechanical, touches many call sites)
- Worth it: **Yes — the single highest-leverage item on this list**

**Add an app-level error boundary + basic crash logging**
- Problem: Zero error boundaries anywhere; any render error white-screens the whole app with no report.
- Why it matters: Currently a production crash is both maximally disruptive and completely invisible to the team.
- Files: `src/routes/__root.tsx` (or `src/main.tsx`)
- Benefit: Graceful failure + visibility into real-world crashes
- Difficulty: Low
- Worth it: **Yes**

**Fix the two setState-in-effect drawers + hardcoded "MH" identity**
- Problem: Effects synchronously setState on open instead of remounting via key; the shared expense form hardcodes the current user's initials.
- Why it matters: Extra render + stale-state edge cases; and the one real global store (auth) isn't used where it should be.
- Files: `sort-filter-drawer.tsx:41-46`, `add-recurring-screen.tsx:63-68`, `add-expense-base.tsx:~230-245`
- Benefit: Correct behavior, removes 3 confirmed lint errors
- Difficulty: Low
- Worth it: **Yes**

**Code-split routes**
- Problem: Zero React.lazy/Suspense usage; all ~20 routes ship in one 1.5MB bundle.
- Why it matters: Cold-start cost grows linearly with every screen added; will not "still be fine" at 100 screens.
- Files: `src/routes/**/*.tsx` (switch to `createLazyFileRoute`)
- Benefit: Smaller initial bundle, faster time-to-interactive
- Difficulty: Medium (mechanical, built-in TanStack Router feature)
- Worth it: **Yes**

### Medium Priority

**Consolidate domain types into one file**
- Problem: Transaction/Contact concepts each have 2-3 overlapping, differently-named shapes across features.
- Why it matters: Makes §14's API integration straightforward instead of a shape-reconciliation exercise.
- Files: `src/types/`, `features/*/types.ts`
- Benefit: One canonical Transaction/Contact/Group type
- Difficulty: Medium
- Worth it: **Yes, but sequence after the data-layer fix above**

**Migrate hardcoded hex colors to design tokens**
- Problem: A complete token system exists in `index.css` but components almost universally use raw arbitrary hex values instead.
- Why it matters: A rebrand or theme change today requires touching ~100 files instead of one.
- Files: `components/shared/*`, `features/*/components/*`
- Benefit: Theme changes become a one-file edit
- Difficulty: Medium (mechanical, no logic change)
- Worth it: **Yes, do incrementally per-feature rather than one giant PR**

**Split group-detail-screen and add-recurring-screen**
- Problem: 743-line and 477-line components each doing 4+ distinct jobs; add-recurring reimplements the expense form instead of reusing AddExpenseBase.
- Why it matters: Easier to review, test, and safely change either.
- Files: `features/groups/group-detail-screen.tsx`, `features/groups/add-recurring-screen.tsx`
- Benefit: Smaller, independently testable units
- Difficulty: Medium
- Worth it: **Yes**

**Add jsx-a11y lint + fix interactive-div rows**
- Problem: Clickable rows built as div+onClick; no automated a11y linting.
- Why it matters: Not keyboard-operable, not screen-reader friendly; the lint plugin prevents regressions automatically.
- Files: `eslint.config.js`, `components/shared/expense-item.tsx` and similar rows
- Benefit: Keyboard/screen-reader support, enforced going forward
- Difficulty: Low
- Worth it: **Yes**

**Unit-test lib/split.ts**
- Problem: The one piece of pure, financially load-bearing logic in the app has zero tests.
- Why it matters: Best test-to-effort ratio available; protects the exact calculation users would notice being wrong.
- Files: `src/lib/split.ts`
- Benefit: Regression safety on the highest-stakes calculation in the app
- Difficulty: Low
- Worth it: **Yes — start testing here, not everywhere at once**

### Low Priority

**Clean up lint stragglers**
- Problem: 26 `any` usages, 1 unused var, 1 dead assignment, 2 fast-refresh violations, 4 stray console calls.
- Why it matters: Mostly cosmetic individually; worth a single cleanup pass once CI is enforcing lint so it doesn't regress again.
- Files: see §4
- Benefit: Cleaner diffs, faster hot-reload
- Difficulty: Low
- Worth it: **Yes, but not urgent**

**Wire lint + typecheck into CI**
- Problem: Nothing currently stops a broken-hooks or any-typed PR from merging.
- Why it matters: Would have caught the Critical hooks bug automatically before it reached this audit.
- Files: new `.github/workflows/ci.yml`
- Benefit: Automatic regression prevention
- Difficulty: Low (~10 min)
- Worth it: **Yes — cheap, durable, do this alongside the Critical fixes**

**Delete or implement empty stub files**
- Problem: `useCapacitor.ts`, `useHaptics.ts`, `features/transactions/{types,schemas,hooks}`, `ROUTES.PROFILE` are all empty/orphaned.
- Why it matters: Low cost either way — mostly a discoverability nit ("where do transactions live?" currently answers wrong).
- Files: `src/hooks/*`, `features/transactions/*`, `constants/routes.ts`
- Benefit: Less confusing folder scan for new contributors
- Difficulty: Trivial
- Worth it: **Yes, bundle with the data-layer work since transactions/ is the natural new home**

> **Explicitly rejected — do not do these:** a generated API client or repository-class hierarchy before a real backend exists; a generic form-builder abstraction over AddExpenseBase; a generic Drawer-of-Drawer wrapper over vaul; React.memo/useCallback passes with no measured performance problem; a full test-coverage mandate before shipping the correctness fixes above. Each would add real complexity today in exchange for a hypothetical future benefit — exactly the trade this audit was asked to flag.

---

## Summarized Backlog & Recommended Order

Work top to bottom — each Critical item is small and isolated; the High-priority data-layer fix is the one item everything else quietly depends on, so it's sequenced right after the standalone Critical fixes.

| # | Priority | Item | Files |
|---|---|---|---|
| 1 | 🔴 Critical | Fix hooks-order bug | `group-detail-screen.tsx` |
| 2 | 🔴 Critical | Replace 13MB splash GIF | `assets/coin.gif` |
| 3 | 🔴 Critical | Gate LAN dev URL out of release builds | `capacitor.config.ts` |
| 4 | 🟠 High | Unify contact/transaction data into stores | `dashboard/data`, `contacts/data`, `store/*` |
| 5 | 🟠 High | Add app-level error boundary + crash logging | `__root.tsx` / `main.tsx` |
| 6 | 🟠 High | Fix setState-in-effect + hardcoded "MH" identity | `sort-filter-drawer.tsx`, `add-recurring-screen.tsx`, `add-expense-base.tsx` |
| 7 | 🟠 High | Code-split routes | `routes/**` |
| 8 | 🟡 Medium | Consolidate domain types | `types/`, `features/*/types.ts` |
| 9 | 🟡 Medium | Migrate hex colors to design tokens | `components/shared/*`, `features/*` |
| 10 | 🟡 Medium | Split oversized screens | `group-detail-screen.tsx`, `add-recurring-screen.tsx` |
| 11 | 🟡 Medium | Add jsx-a11y + fix interactive divs | `eslint.config.js`, `expense-item.tsx` |
| 12 | 🟡 Medium | Unit test `lib/split.ts` | `lib/split.ts` |
| 13 | ⚪ Low | Clean up remaining lint (any, unused, dead code) | see §4 |
| 14 | ⚪ Low | Wire lint + typecheck into CI | `.github/workflows/` |
| 15 | ⚪ Low | Delete/implement empty stub files | `hooks/*`, `features/transactions/*` |

Ready to work through these one at a time — say which number to start with, or "start from the top."

---
*Prepared 2026-07-03 — scope: frontend only, no backend criticism.*
