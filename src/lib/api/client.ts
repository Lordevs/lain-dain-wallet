import createClient from 'openapi-fetch'
import type { paths } from './schema'
import { env } from '../env'
import { clearRefreshToken, getRefreshToken, setRefreshToken } from '../secure-storage'
import { useAuthStore } from '@/store/use-auth-store'
import { queryClient } from '@/lib/query-client'

/**
 * The one typed HTTP client for the whole app — every screen's data layer
 * (TanStack Query queryFn/mutationFn) should call through this, never a
 * bare `fetch`. Types come straight from the backend's own OpenAPI schema
 * (see openapi/schema.yml + `pnpm api:generate`), so a field rename on the
 * backend shows up as a compile error here, not a silent runtime mismatch.
 */
export const apiClient = createClient<paths>({ baseUrl: env.apiBaseUrl })

// simplejwt's ACCESS_TOKEN_LIFETIME is 30min — short enough that hitting
// this path is routine, not exceptional, for anyone using the app for a
// while. ROTATE_REFRESH_TOKENS is also on server-side: every refresh call
// returns a NEW refresh token and blacklists the old one, so a successful
// refresh always writes both tokens, never just the access token.
//
// apps.accounts is mounted at "api/auth/" in config/urls.py, not
// "api/accounts/" — the app's own internal name doesn't match its URL
// prefix, easy to get wrong without checking urls.py directly.
const REFRESH_PATH = '/api/auth/token/refresh/'
const STARTUP_REFRESH_TIMEOUT_MS = 8_000

// Concurrent 401s (e.g. a screen firing several queries at once right as
// the access token expires) must share one in-flight refresh, not each
// fire their own — a second refresh call would be rejected anyway once
// rotation blacklists the refresh token the first call already consumed.
let refreshPromise: Promise<string | null> | null = null

// Exported so the cold-start bootstrap (src/lib/api/bootstrap.ts) can
// reuse the exact same refresh+dedupe logic instead of duplicating it.
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refresh = await getRefreshToken()
    if (!refresh) return null

    let response: Response
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), STARTUP_REFRESH_TIMEOUT_MS)
    try {
      response = await fetch(`${env.apiBaseUrl}${REFRESH_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
        signal: controller.signal,
      })
    } catch {
      return null // offline — caller decides what "no token" means here
    } finally {
      window.clearTimeout(timeout)
    }
    if (!response.ok) return null

    const data = (await response.json()) as { access: string; refresh?: string }
    if (data.refresh) await setRefreshToken(data.refresh)
    useAuthStore.getState().setAccessToken(data.access)
    return data.access
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

// openapi-fetch's own fetch() call consumes a request's body stream, so by
// the time onResponse sees a 401, `new Request(request, {...})` throws for
// any POST/PATCH/PUT/DELETE-with-body call ("body stream already read") —
// GET requests only survived by accident, having no body to consume. Stash
// an unused clone in onRequest, while the body is still readable, so the
// retry has a fresh stream to send.
const pendingBodyClones = new WeakMap<Request, Request>()

apiClient.use({
  onRequest({ request }) {
    if (request.url.includes(REFRESH_PATH)) return request
    const token = useAuthStore.getState().accessToken
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    if (request.body) pendingBodyClones.set(request, request.clone())
    return request
  },

  async onResponse({ request, response }) {
    if (response.status !== 401 || request.url.includes(REFRESH_PATH)) {
      return response
    }

    const newAccessToken = await refreshAccessToken()
    if (!newAccessToken) {
      // The refresh token itself is gone, expired, or blacklisted —
      // nothing left to do but sign out. The original 401 response is
      // returned as-is; the caller sees an auth failure either way.
      // queryClient.clear(): most query keys in this app don't include a
      // user id, so without this, whoever signs in next on this same
      // device (a different account) would see this account's cached
      // data until each query's own gcTime/staleTime happened to expire.
      await clearRefreshToken()
      queryClient.clear()
      useAuthStore.getState().logout()
      return response
    }

    const bodySource = pendingBodyClones.get(request) ?? request
    pendingBodyClones.delete(request)
    const retryRequest = new Request(bodySource, {
      headers: { ...Object.fromEntries(request.headers), Authorization: `Bearer ${newAccessToken}` },
    })
    return fetch(retryRequest)
  },
})
