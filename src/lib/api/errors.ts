// DRF error bodies aren't one consistent shape: APIView-level errors (e.g.
// VerifyOTPView's OTPError) come back as {"detail": "..."}, but plain
// serializer validation errors (e.g. RequestOTPSerializer rejecting a
// malformed phone number) come back as {"<field>": ["...", ...]} instead —
// there's no single field name to always read.
export function extractApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error || typeof error !== 'object') return fallback

  const body = error as Record<string, unknown>

  if (typeof body.detail === 'string') return body.detail

  for (const value of Object.values(body)) {
    if (typeof value === 'string') return value
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  }

  return fallback
}
