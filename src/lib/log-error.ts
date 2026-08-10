// Central seam for crash reporting - swap the body for a real service (e.g. Sentry, Bugsnag) later.
export function logError(error: unknown, info?: { componentStack: string }) {
  // Error.message and Error.stack are non-enumerable. Capacitor's native
  // console bridge JSON-serializes values, which previously reduced an
  // ApiError to only {name, fields} and hid the useful server message.
  const printableError = error instanceof Error
    ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...('fields' in error ? { fields: error.fields } : {}),
      }
    : error
  console.error('[Lain Dain] Unhandled error', printableError, info)
}
