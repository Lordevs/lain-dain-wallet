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
import './index.css'

const router = createRouter({ routeTree, defaultErrorComponent: ErrorFallback })

// The persister's default maxAge is 24h — gcTime must be at least that,
// or a query gets garbage-collected from memory (and so has nothing left
// to write) before it's ever actually persisted to disk.
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { gcTime: CACHE_MAX_AGE },
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: CACHE_MAX_AGE }}>
      <RouterProvider router={router} />
    </PersistQueryClientProvider>
  </StrictMode>,
)
