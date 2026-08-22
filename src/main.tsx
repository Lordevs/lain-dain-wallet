import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import type { PersistedClient } from '@tanstack/query-persist-client-core'
import { routeTree } from './routeTree.gen'
import ErrorFallback from './components/layout/error-fallback'
import { preferencesStorage } from './lib/query-persister-storage'
import { setUpNetworkStatusListener } from './lib/network'
import { setUpSyncTriggers } from './lib/sync/triggers'
import { bootstrapAuth } from './lib/api/bootstrap'
import { getDatabase } from './lib/sqlite/init'
import { queryClient, CACHE_MAX_AGE } from './lib/query-client'
import './index.css'

const router = createRouter({ routeTree, defaultErrorComponent: ErrorFallback })

// Infinite/paginated queries (My Expenses, Friendships, Groups, group/
// friendship transactions, Notifications — the app-wide 'infinite' query
// key convention) used to be excluded from persistence entirely, since a
// scrolled timeline's full page buffer could be large and every write
// pushes the *entire* dehydrated cache across the Capacitor bridge. That
// meant none of those screens had anything to restore from on a cold
// start — which on a Capacitor app (OS-suspended/evicted WebView after
// backgrounding for camera/SMS/multitasking) happens far more often than
// a plain page refresh, making it look like the app never caches anything.
// Trimming each infinite query down to just its first page before
// serializing keeps the persisted blob's size bounded regardless of how
// far anyone scrolled, while still giving every list screen *something*
// to show instantly instead of a skeleton on the very next cold start.
const MAX_INFINITE_PAGES_PERSISTED = 1

function trimInfiniteQueriesForPersist(client: PersistedClient): PersistedClient {
  return {
    ...client,
    clientState: {
      ...client.clientState,
      queries: client.clientState.queries.map((query) => {
        if (query.queryType !== 'infinite') return query
        const data = query.state.data as { pages: unknown[]; pageParams: unknown[] } | undefined
        if (!data || !Array.isArray(data.pages) || data.pages.length <= MAX_INFINITE_PAGES_PERSISTED) {
          return query
        }
        return {
          ...query,
          state: {
            ...query.state,
            data: {
              pages: data.pages.slice(0, MAX_INFINITE_PAGES_PERSISTED),
              pageParams: data.pageParams.slice(0, MAX_INFINITE_PAGES_PERSISTED),
            },
          },
        }
      }),
    },
  }
}

// Page trimming alone doesn't bound the blob: 30-day gcTime means every
// per-entity query ever mounted ('expense', 'group', 'friendship',
// 'settlement', …) accumulates in the same serialized blob indefinitely.
// Past this cap, keep only the most recently *updated* queries (newest-
// first greedy fill) — the least recently updated entries fall off first,
// which is exactly the staleness order a cold start cares about. Nothing
// evicted here is durable data: SQLite (expenses table + resource
// snapshots) remains the offline source of truth, so an evicted entry just
// means a skeleton-then-local-refetch on some future cold start, never
// lost information. (Per-entry sizes are each entry's own JSON length —
// an approximation that slightly undercounts wrapper overhead, harmless
// for a soft cap.)
const MAX_PERSISTED_CACHE_BYTES = 4 * 1024 * 1024

function boundPersistedCacheSize(client: PersistedClient): PersistedClient {
  const sized = client.clientState.queries
    .map((query) => ({ query, bytes: JSON.stringify(query).length }))
    .sort((a, b) => b.query.state.dataUpdatedAt - a.query.state.dataUpdatedAt)
  const kept: Array<{ query: (typeof sized)[number]['query']; bytes: number }> = []
  let total = 0
  for (const entry of sized) {
    if (total + entry.bytes > MAX_PERSISTED_CACHE_BYTES) break
    kept.push(entry)
    total += entry.bytes
  }
  return {
    ...client,
    clientState: {
      ...client.clientState,
      // Mutations are always kept — there are only ever a handful, and
      // they're the one part of the dehydrated state with side effects.
      queries: kept.map((entry) => entry.query),
    },
  }
}

const persister = createAsyncStoragePersister({
  storage: preferencesStorage,
  key: 'lain-dain-query-cache',
  // Default is 1000ms — bumped since every write pushes the *entire*
  // dehydrated cache across the Capacitor bridge into native storage
  // (UserDefaults/SharedPreferences), which isn't designed for frequent
  // large writes the way localStorage is.
  throttleTime: 5000,
  serialize: (client) => JSON.stringify(boundPersistedCacheSize(trimInfiniteQueriesForPersist(client))),
})

// @capacitor/network, not the browser's navigator.onLine — see
// src/lib/network.ts for why. Registered once, here, not per-component:
// onlineManager is an app-wide singleton, this isn't tied to anything's
// mount/unmount lifecycle.
setUpNetworkStatusListener()

// Creates/opens the local SQLite store — the offline expense outbox
// (src/lib/sync/expense-outbox.ts) reads/writes through this. Fired
// alongside bootstrapAuth(), not chained into its .finally() — a slow or
// failed open must never block first render; queueing an expense before
// this resolves just awaits the same shared connection promise.
getDatabase().catch((error) => {
  console.error('SQLite init failed', error)
})

// Reconnect-triggered sync for every resource with an offline outbox —
// see setUpSyncTriggers's own doc comment for why this is separate from
// setUpNetworkStatusListener() above (feeding onlineManager vs. reacting
// to it) and where the app-foreground trigger lives instead.
setUpSyncTriggers()

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
              // Infinite queries ARE persisted now too (trimmed to their
              // first page by the persister's own `serialize`, see
              // trimInfiniteQueriesForPersist above) — only genuinely
              // unsuccessful queries are excluded. This one-line check
              // mirrors TanStack's own default rather than importing it
              // directly (@tanstack/react-query-persist-client resolves a
              // different copy of @tanstack/query-core than
              // @tanstack/react-query does, so their Query types aren't
              // assignable to each other).
              shouldDehydrateQuery: (query) => query.state.status === 'success',
            },
          }}
        >
          <RouterProvider router={router} />
        </PersistQueryClientProvider>
      </StrictMode>,
    )
  })
