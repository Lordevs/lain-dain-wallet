// Central seam for crash reporting - swap the body for a real service (e.g. Sentry, Bugsnag) later.
export function logError(error: unknown, info?: { componentStack: string }) {
  console.error('[Lain Dain] Unhandled error', error, info)
}
