export interface CurrencyMismatch {
  yourCurrency: string
  theirCurrency: string
}

// services.start_friendship raises this exact, deterministic message
// (see apps/ledger/services.py) whenever two people's default_currency
// differ and no currency/exchange_rate was sent — there's no structured
// error code for it (this codebase's error responses are always a plain
// {"detail": message}, never a machine-parseable payload), so this is the
// one place the two currencies involved are knowable before the ledger
// exists. If that message's wording ever changes, this stops matching and
// the mismatch simply falls back to a generic inline error instead of
// opening the drawer — never throws.
const MISMATCH_PATTERN = /you use ([A-Z]{3}), they use ([A-Z]{3})/

export function parseCurrencyMismatch(message: string): CurrencyMismatch | null {
  const match = MISMATCH_PATTERN.exec(message)
  if (!match) return null
  return { yourCurrency: match[1], theirCurrency: match[2] }
}
