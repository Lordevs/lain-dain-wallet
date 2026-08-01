import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { routeTree } from './routeTree.gen'
import ErrorFallback from './components/layout/error-fallback'
import { preferencesStorage } from './lib/query-persister-storage'
import { setUpNetworkStatusListener } from './lib/network'
import { bootstrapAuth } from './lib/api/bootstrap'
import './index.css'

const router = createRouter({ routeTree, defaultErrorComponent: ErrorFallback })

// The persister's default maxAge is 24h — gcTime must be at least that,
// or a query gets garbage-collected from memory (and so has nothing left
// to write) before it's ever actually persisted to disk.
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: CACHE_MAX_AGE,
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
    // 'online' (the default) is what makes a mutation fired while offline
    // sit paused instead of failing outright — see src/lib/network.ts and
    // the wallet/expense mutations that will register here once they
    // exist. Left implicit/default rather than restated, so a future
    // change to the actual default doesn't silently drift from this
    // comment.
  },
})

const persister = createAsyncStoragePersister({
  storage: preferencesStorage,
  key: 'lain-dain-query-cache',
  // Default is 1000ms — bumped since every write pushes the *entire*
  // dehydrated cache across the Capacitor bridge into native storage
  // (UserDefaults/SharedPreferences), which isn't designed for frequent
  // large writes the way localStorage is.
  throttleTime: 5000,
})

// @capacitor/network, not the browser's navigator.onLine — see
// src/lib/network.ts for why. Registered once, here, not per-component:
// onlineManager is an app-wide singleton, this isn't tied to anything's
// mount/unmount lifecycle.
setUpNetworkStatusListener()

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// __root.tsx's beforeLoad reads auth state synchronously on the very first
// navigation — it can't wait for an async restore itself, so this has to
// resolve (or fail silently) before the router ever renders.
bootstrapAuth()
  .catch(() => {})
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: CACHE_MAX_AGE,
            dehydrateOptions: {
              // Infinite/paginated queries (query key includes 'infinite'
              // or 'infinite-v2', the app-wide convention for them) are
              // excluded from persistence — their page buffers can grow
              // large (a scrolled group timeline, for instance), and
              // createAsyncStoragePersister writes the *entire* dehydrated
              // cache across the Capacitor bridge on every change.
              // Persisting only the bounded, non-paginated queries keeps
              // that write small regardless of how far someone has
              // scrolled this session. The `status === 'success'` check
              // mirrors TanStack's own default (not imported directly —
              // @tanstack/react-query-persist-client resolves a different
              // copy of @tanstack/query-core than @tanstack/react-query
              // does, so their Query types aren't assignable to each
              // other; reimplementing this one-line check sidesteps it).
              shouldDehydrateQuery: (query) =>
                query.state.status === 'success'
                && !query.queryKey.some((key) => typeof key === 'string' && key.startsWith('infinite')),
            },
          }}
        >
          <RouterProvider router={router} />
        </PersistQueryClientProvider>
      </StrictMode>,
    )
  })
