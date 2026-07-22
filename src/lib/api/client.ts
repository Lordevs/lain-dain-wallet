import createClient from 'openapi-fetch'
import type { paths } from './schema'
import { env } from '../env'
import { clearRefreshToken, getRefreshToken, setRefreshToken } from '../secure-storage'
import { useAuthStore } from '@/store/use-auth-store'

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
const REFRESH_PATH = '/accounts/token/refresh/'

// Concurrent 401s (e.g. a screen firing several queries at once right as
// the access token expires) must share one in-flight refresh, not each
// fire their own — a second refresh call would be rejected anyway once
// rotation blacklists the refresh token the first call already consumed.
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refresh = await getRefreshToken()
    if (!refresh) return null

    let response: Response
    try {
      response = await fetch(`${env.apiBaseUrl}${REFRESH_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
    } catch {
      return null // offline — caller decides what "no token" means here
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

apiClient.use({
  onRequest({ request }) {
    if (request.url.includes(REFRESH_PATH)) return request
    const token = useAuthStore.getState().accessToken
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
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
      await clearRefreshToken()
      useAuthStore.getState().logout()
      return response
    }

    const retryRequest = new Request(request, {
      headers: { ...Object.fromEntries(request.headers), Authorization: `Bearer ${newAccessToken}` },
    })
    return fetch(retryRequest)
  },
})
