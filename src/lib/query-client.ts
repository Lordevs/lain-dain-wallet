import { QueryClient } from '@tanstack/react-query'

// The persister's default maxAge is 24h — gcTime must be at least that,
// or a query gets garbage-collected from memory (and so has nothing left
// to write) before it's ever actually persisted to disk.
// Derived server projections (wallet/balance/report views) complement the
// normalized SQLite records while offline. Keep the last authenticated
// snapshot for a realistic extended-offline window; logout still clears
// the entire account cache, so this does not cross user boundaries.
export const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 30

// NOT the same value as CACHE_MAX_AGE, on purpose — gcTime feeds directly
// into a real `setTimeout(cb, gcTime)` call (query-core's Query.scheduleGc)
// every time a query loses its last observer, i.e. on every navigation
// away from a screen. setTimeout's delay is a 32-bit signed int
// (2_147_483_647ms, ~24.855 days); CACHE_MAX_AGE's 30 days overflows that
// and every browser silently clamps an out-of-range delay to ~0 — so with
// gcTime: CACHE_MAX_AGE, every query was being garbage-collected from the
// live cache almost immediately after its last observer unmounted, not
// after 30 days. That's what made every screen look like it re-fetched
// from scratch on every revisit, online or offline, confirmed by
// instrumenting query-core's scheduleGc directly. Comfortably under the
// setTimeout ceiling here; the persister's own maxAge (a plain timestamp
// comparison, not a timer) can safely stay at the full 30 days above.
export const GC_TIME = 1000 * 60 * 60 * 24 * 21

// A plain module-level singleton, not just something handed to
// PersistQueryClientProvider in main.tsx — logout needs to clear it from
// outside the React tree too (src/lib/api/client.ts's 401 handler isn't a
// component), and most query keys in this app don't include a user id, so
// switching accounts on the same device without clearing this would leak
// the previous account's cached data into the new one's screens.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: GC_TIME,
      // Without this, v5's default of 0 means every mount/remount, window
      // refocus, and invalidateQueries call refetches immediately, even
      // when the data is almost certainly still fine — this was the
      // single biggest source of redundant network traffic in the app.
      // Individual hooks still override this in both directions: down to
      // 0 for genuinely volatile data (wallet, unread counts), up higher
      // for near-static data (categories, group/friendship info).
      staleTime: 30_000,
      // Default is 3 retries with exponential backoff (~7s of a blank
      // skeleton with no feedback on a flaky mobile connection) before
      // ever showing an error. One retry is enough to absorb a dropped
      // packet without leaving the screen looking stuck.
      retry: 1,
    },
    mutations: {
      // Offline-safe mutation functions must run immediately so they can
      // persist their intent into SQLite. With TanStack's default
      // `online` mode the function itself is paused, meaning nothing is
      // durable if the process is killed before reconnect. Intentionally
      // online-only operations (OTP, device registration, issue reports)
      // execute too and surface their normal network error instead of
      // pretending they were queued.
      networkMode: 'always',
    },
  },
})
