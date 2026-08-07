import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { routeTree } from './routeTree.gen'
import ErrorFallback from './components/layout/error-fallback'
import { preferencesStorage } from './lib/query-persister-storage'
import { setUpNetworkStatusListener } from './lib/network'
import { bootstrapAuth } from './lib/api/bootstrap'
import { queryClient, CACHE_MAX_AGE } from './lib/query-client'
import './index.css'

const router = createRouter({ routeTree, defaultErrorComponent: ErrorFallback })

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
