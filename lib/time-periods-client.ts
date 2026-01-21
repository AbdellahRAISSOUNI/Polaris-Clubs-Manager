export type TimePeriodType = "mandate" | "academicYear"

export interface TimePeriod {
  id: string
  type: TimePeriodType
  name: string
  start_date: string // ISO
  end_date: string // ISO
  created_at?: string | null
  updated_at?: string | null
}

export function periodToDates(p: TimePeriod) {
  return {
    ...p,
    startDate: new Date(p.start_date),
    endDate: new Date(p.end_date),
  }
}

export function getCurrentPeriod(periods: TimePeriod[], now = new Date()): TimePeriod | null {
  const matches = periods
    .map((p) => ({ p, start: new Date(p.start_date), end: new Date(p.end_date) }))
    .filter(({ start, end }) => !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()))
    .filter(({ start, end }) => start <= now && now <= end)
    .sort((a, b) => {
      // Prefer the most recently started period when multiple overlap.
      const byStart = b.start.getTime() - a.start.getTime()
      if (byStart !== 0) return byStart
      return b.end.getTime() - a.end.getTime()
    })

  return matches.length > 0 ? matches[0].p : null
}

export function getPreviousPeriod(periods: TimePeriod[], current: TimePeriod | null, now = new Date()): TimePeriod | null {
  const currentStart = current ? new Date(current.start_date) : null
  const candidates = periods
    .map((p) => ({ p, end: new Date(p.end_date) }))
    .filter(({ end }) => !Number.isNaN(end.getTime()))
    .filter(({ p, end }) => {
      if (currentStart && !Number.isNaN(currentStart.getTime())) {
        return end < currentStart
      }
      return end < now
    })
    .sort((a, b) => b.end.getTime() - a.end.getTime())

  return candidates.length > 0 ? candidates[0].p : null
}

