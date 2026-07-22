// Vite only exposes VITE_-prefixed vars to client code (import.meta.env) —
// this is the one place that boundary is crossed, so nothing else in the
// app reads import.meta.env directly.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (!apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is not set — copy .env.example to .env and fill it in.')
}

export const env = {
  apiBaseUrl,
}
