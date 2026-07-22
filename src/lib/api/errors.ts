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

// Same DRF body, but keyed by field name instead of flattened to one
// string — lets a form highlight the specific input a validation error
// belongs to (e.g. {"email": ["..."]}) instead of only showing a generic
// banner. "detail" is deliberately excluded: it's a whole-request error
// (e.g. wrong OTP code), never a specific field's fault.
export function extractFieldErrors(error: unknown): Record<string, string> {
  if (!error || typeof error !== 'object') return {}

  const body = error as Record<string, unknown>
  const fields: Record<string, string> = {}

  for (const [key, value] of Object.entries(body)) {
    if (key === 'detail') continue
    if (typeof value === 'string') fields[key] = value
    else if (Array.isArray(value) && typeof value[0] === 'string') fields[key] = value[0]
  }

  return fields
}

// Thrown by every mutation's mutationFn instead of a plain Error — `.message`
// keeps every existing `error?.message` call site working unchanged, while
// `.fields` lets a form additionally map a specific error onto the input
// that caused it (see profile-form.tsx's use of react-hook-form's setError).
export class ApiError extends Error {
  fields: Record<string, string>

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.fields = fields
  }
}

export function toApiError(error: unknown): ApiError {
  return new ApiError(extractApiErrorMessage(error), extractFieldErrors(error))
}
