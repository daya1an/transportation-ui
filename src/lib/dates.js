// Dates travel as plain YYYY-MM-DD strings. These helpers avoid timezone shifts by never using UTC conversion.
const ISO = /^\d{4}-\d{2}-\d{2}$/

export function isIsoDate(value) {
  if (typeof value !== 'string' || !ISO.test(value)) return false
  return toIso(parseIso(value)) === value // the round trip rejects impossible dates such as 2025-02-30
}

export function parseIso(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toIso(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function addDays(iso, days) {
  const date = parseIso(iso)
  date.setDate(date.getDate() + days)
  return toIso(date)
}

/** The `days` days that end on `lastIso`, inclusive. */
export function windowEndingAt(lastIso, days) {
  return { from: addDays(lastIso, -(days - 1)), to: lastIso }
}

/** Axis label for a chart bucket, depending on the zoom level. */
export function formatBucket(iso, granularity) {
  const date = parseIso(iso)
  if (granularity === 'yearly') return String(date.getFullYear())
  if (granularity === 'monthly') return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export const formatDate = (iso) => (iso ? parseIso(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-')
