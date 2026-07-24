export interface Period {
  year: number
  month: number
}

/** Calendar-month approximation of the last `count` periods (including the
 * current one) for the month-picker dropdown — a client-side label list,
 * not the backend's own custom period boundaries (see _period_bounds),
 * which only matter for the actual data query. */
export function recentPeriods(count = 12): Period[] {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })
}

export function periodKey(period: Period): string {
  return `${period.year}-${String(period.month).padStart(2, '0')}`
}

export function parsePeriodKey(key: string): Period {
  const [year, month] = key.split('-').map(Number)
  return { year, month }
}

export function periodLabel(period: Period): string {
  return new Date(period.year, period.month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}
