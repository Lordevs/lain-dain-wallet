// Local (offline) replica of apps/expenses/services.py's My Expenses
// summary/category-breakdown/monthly-trend functions (_period_bounds,
// _current_period_year_month, my_expenses_summary,
// my_expenses_category_breakdown, my_expenses_monthly_trend) — see that
// file for the source of truth this mirrors line-for-line on the date
// arithmetic.
//
// Currency: every Expense within one group/friendship is recorded in
// that scope's own currency; only the "my expenses" aggregate (which
// spans every scope) ever needs to convert into the viewer's personal
// default_currency. This file converts using each GROUP's own cached
// `currency_rates` (verified direction: rate = units of viewer_currency
// per 1 unit of the group's own currency, straight multiply — see
// apps.ledger.models.CurrencyRate's docstring). Friendship-scoped
// expenses in a foreign currency are NOT converted here (added at face
// value) — friendship's own `exchange_rate` field's sign convention
// wasn't verified against this exact direction, so this is a deliberate,
// narrower gap left as a known approximation rather than risk a wrong
// conversion direction silently misreporting spend.
//
// Also uses the CURRENT cached rate, not the rate active when each
// expense was recorded (the backend's point-in-time behavior) — same
// already-accepted approximation as the wallet summary's offline path.

import type { components } from '@/lib/api/schema'

type ExpenseRead = components['schemas']['ExpenseRead']
type Group = components['schemas']['Group']
type PersonalExpenseSettings = components['schemas']['PersonalExpenseSettings']

function clampedDate(year: number, month: number, day: number): { year: number; month: number; day: number } {
  const lastDay = new Date(year, month, 0).getDate()
  return { year, month, day: Math.min(day, lastDay) }
}

function toIsoDate({ year, month, day }: { year: number; month: number; day: number }): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function nextYearMonth(year: number, month: number): [number, number] {
  return month < 12 ? [year, month + 1] : [year + 1, 1]
}

function previousYearMonth(year: number, month: number): [number, number] {
  return month > 1 ? [year, month - 1] : [year - 1, 12]
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function periodBounds(startDay: number, year: number, month: number): { start: string; end: string } {
  const start = toIsoDate(clampedDate(year, month, startDay))
  const [ny, nm] = nextYearMonth(year, month)
  const nextStart = toIsoDate(clampedDate(ny, nm, startDay))
  return { start, end: addDays(nextStart, -1) }
}

export function currentPeriodYearMonth(startDay: number, todayIso: string): [number, number] {
  const [year, month] = todayIso.split('-').map(Number)
  const boundary = toIsoDate(clampedDate(year, month, startDay))
  if (todayIso >= boundary) return [year, month]
  return previousYearMonth(year, month)
}

function myShareCents(expense: ExpenseRead, meId: string): number {
  const split = expense.splits.find((s) => s.id === meId)
  return split ? Math.round(Number(split.amount_owed) * 100) : 0
}

function convertToViewerCurrency(
  amountCents: number,
  expenseCurrency: string,
  viewerCurrency: string,
  groupsById: Map<string, Group>,
  groupId: string | null | undefined,
): number {
  if (expenseCurrency === viewerCurrency) return amountCents
  const group = groupId ? groupsById.get(groupId) : undefined
  const rate = group?.currency_rates?.find((r) => r.currency === viewerCurrency)?.rate
  if (!rate) return amountCents // undconverted fallback — see file header
  return Math.round(amountCents * Number(rate))
}

function inPeriod(expense: ExpenseRead, start: string, end: string): boolean {
  return expense.date >= start && expense.date <= end
}

function isVisible(expense: ExpenseRead, settings: PersonalExpenseSettings): boolean {
  if (expense.context === 'personal') return true
  if (expense.context === 'friendship') return !settings.hidden_friendship_ids?.includes(expense.friendship ?? '')
  if (expense.context === 'group') return !settings.hidden_group_ids?.includes(expense.group ?? '')
  return true
}

function totalCents(
  expenses: ExpenseRead[],
  meId: string,
  viewerCurrency: string,
  groupsById: Map<string, Group>,
): number {
  return expenses.reduce(
    (sum, e) => sum + convertToViewerCurrency(myShareCents(e, meId), e.currency, viewerCurrency, groupsById, e.group),
    0,
  )
}

function centsToAmount(cents: number): string {
  return (cents / 100).toFixed(2)
}

export interface LocalSummaryInput {
  allExpenses: ExpenseRead[]
  settings: PersonalExpenseSettings
  groupsById: Map<string, Group>
  meId: string
  viewerCurrency: string
  todayIso: string
  year?: number
  month?: number
}

export function computeLocalSummary(input: LocalSummaryInput): components['schemas']['MyExpensesSummary'] {
  const { allExpenses, settings, groupsById, meId, viewerCurrency, todayIso } = input
  const [year, month] = input.year && input.month
    ? [input.year, input.month]
    : currentPeriodYearMonth(settings.period_start_day, todayIso)
  const { start, end } = periodBounds(settings.period_start_day, year, month)

  const visible = allExpenses.filter((e) => isVisible(e, settings) && inPeriod(e, start, end))
  const spentCents = totalCents(visible, meId, viewerCurrency, groupsById)
  const spent = centsToAmount(spentCents)

  const limit = settings.monthly_budget_limit ? Number(settings.monthly_budget_limit) : null
  const [ny, nm] = nextYearMonth(year, month)
  const resetsOn = periodBounds(settings.period_start_day, ny, nm).start

  let previousSpent: string | null = null
  if (settings.show_spending_comparison) {
    const [py, pm] = previousYearMonth(year, month)
    const prevBounds = periodBounds(settings.period_start_day, py, pm)
    const prevVisible = allExpenses.filter((e) => isVisible(e, settings) && inPeriod(e, prevBounds.start, prevBounds.end))
    previousSpent = centsToAmount(totalCents(prevVisible, meId, viewerCurrency, groupsById))
  }

  return {
    period_start: start,
    period_end: end,
    resets_on: resetsOn,
    currency: viewerCurrency,
    spent,
    comparison_enabled: settings.show_spending_comparison,
    previous_spent: previousSpent,
    budget_limit: limit !== null ? limit.toFixed(2) : null,
    budget_alert_enabled: settings.budget_alert_enabled,
    budget_alert_threshold_percent: settings.budget_alert_threshold_percent,
    budget_used_percentage: limit ? Math.round((spentCents / 100 / limit) * 1000) / 10 : null,
    is_over_budget: limit !== null && spentCents / 100 > limit,
  }
}

export function computeLocalCategoryBreakdown(
  input: LocalSummaryInput,
): components['schemas']['CategoryBreakdownItem'][] {
  const { allExpenses, settings, groupsById, meId, viewerCurrency, todayIso } = input
  const [year, month] = input.year && input.month
    ? [input.year, input.month]
    : currentPeriodYearMonth(settings.period_start_day, todayIso)
  const { start, end } = periodBounds(settings.period_start_day, year, month)
  const visible = allExpenses.filter((e) => isVisible(e, settings) && inPeriod(e, start, end))

  const totalsByCategory = new Map<string, number>()
  const categoriesById = new Map<string, components['schemas']['Category']>()
  for (const e of visible) {
    const cents = convertToViewerCurrency(myShareCents(e, meId), e.currency, viewerCurrency, groupsById, e.group)
    totalsByCategory.set(e.category.id, (totalsByCategory.get(e.category.id) ?? 0) + cents)
    categoriesById.set(e.category.id, e.category)
  }
  const grandTotal = [...totalsByCategory.values()].reduce((a, b) => a + b, 0)

  return [...totalsByCategory.entries()]
    .filter(([, cents]) => cents > 0)
    .map(([catId, cents]) => ({
      category: categoriesById.get(catId)!,
      total: centsToAmount(cents),
      percentage: grandTotal ? Math.round((cents / grandTotal) * 1000) / 10 : 0,
    }))
    .sort((a, b) => Number(b.total) - Number(a.total))
}

export function computeLocalMonthlyTrend(
  input: Omit<LocalSummaryInput, 'year' | 'month'>,
): components['schemas']['MonthlyTrendItem'][] {
  const { allExpenses, settings, groupsById, meId, viewerCurrency, todayIso } = input
  let [year, month] = currentPeriodYearMonth(settings.period_start_day, todayIso)
  const yearMonths: [number, number][] = [[year, month]]
  for (let i = 0; i < 11; i++) {
    ;[year, month] = previousYearMonth(year, month)
    yearMonths.unshift([year, month])
  }

  return yearMonths.map(([y, m]) => {
    const { start, end } = periodBounds(settings.period_start_day, y, m)
    const visible = allExpenses.filter((e) => isVisible(e, settings) && inPeriod(e, start, end))
    return {
      year: y,
      month: m,
      period_start: start,
      period_end: end,
      total: centsToAmount(totalCents(visible, meId, viewerCurrency, groupsById)),
    }
  })
}

export interface LocalBudgetsOverviewInput {
  allExpenses: ExpenseRead[]
  settings: PersonalExpenseSettings
  groupsById: Map<string, Group>
  meId: string
  viewerCurrency: string
  todayIso: string
  year?: number
  month?: number
  /** Raw CategoryBudget rows from the offline snapshot ('budget-limits'). */
  limits: Array<{ categoryId: string; limitAmount: string }>
  /** Every visible category in server order — the 'categories' snapshot. */
  categories: components['schemas']['Category'][]
}

// Local replica of services.category_budgets_overview — same period
// arithmetic and spend pool as computeLocalSummary above (the backend's
// overview reuses my_expenses_category_breakdown's pool), but one row per
// *visible* category including zero-spend ones, each with its snapshot
// limit if one exists ("absence of a limit isn't an error" — see the
// backend function's own docstring).
export function computeLocalBudgetsOverview(
  input: LocalBudgetsOverviewInput,
): components['schemas']['CategoryBudgetsOverview'] {
  const { allExpenses, settings, groupsById, meId, viewerCurrency, todayIso } = input
  const [year, month] = input.year && input.month
    ? [input.year, input.month]
    : currentPeriodYearMonth(settings.period_start_day, todayIso)
  const { start, end } = periodBounds(settings.period_start_day, year, month)
  const [ny, nm] = nextYearMonth(year, month)
  const resetsOn = periodBounds(settings.period_start_day, ny, nm).start

  const visible = allExpenses.filter((e) => isVisible(e, settings) && inPeriod(e, start, end))
  const spentCentsByCategory = new Map<string, number>()
  for (const e of visible) {
    const cents = convertToViewerCurrency(myShareCents(e, meId), e.currency, viewerCurrency, groupsById, e.group)
    spentCentsByCategory.set(e.category.id, (spentCentsByCategory.get(e.category.id) ?? 0) + cents)
  }

  // Backend total_budget sums every CategoryBudget row the user has,
  // regardless of whether its category is currently visible.
  const limitsByCategory = new Map(input.limits.map((limit) => [limit.categoryId, limit.limitAmount]))
  let totalBudgetCents = 0
  for (const amount of limitsByCategory.values()) totalBudgetCents += Math.round(Number(amount) * 100)

  let totalSpentCents = 0
  const rows = input.categories.map((category) => {
    const spentCents = spentCentsByCategory.get(category.id) ?? 0
    totalSpentCents += spentCents
    const limitAmount = limitsByCategory.get(category.id) ?? null
    return {
      category,
      spent: centsToAmount(spentCents),
      limit_amount: limitAmount,
      used_percentage: limitAmount
        ? Math.round((spentCents / 100 / Number(limitAmount)) * 1000) / 10
        : null,
    }
  })

  return {
    period_start: start,
    period_end: end,
    resets_on: resetsOn,
    currency: viewerCurrency,
    total_budget: centsToAmount(totalBudgetCents),
    total_spent: centsToAmount(totalSpentCents),
    categories: rows,
  }
}
