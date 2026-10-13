import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { isIsoDate, windowEndingAt } from '../../lib/dates'
import { useMeta } from '../../hooks/queries'

export const GRANULARITIES = ['weekly', 'monthly', 'yearly']
const DEFAULT_GRANULARITY = 'monthly'

/**
 * Dashboard filters live in the URL (?city=kochi&from=2025-11-01&to=2025-11-30&g=weekly), so a view can be
 * bookmarked or shared and survives a reload. Missing or invalid values fall back to the API's defaults:
 * all cities and the latest N days of data.
 */
export function useFilters() {
  const [params, setParams] = useSearchParams()
  const meta = useMeta('all')

  const cities = meta.data?.cities ?? []
  const minDate = meta.data?.min_date ?? null
  const maxDate = meta.data?.max_date ?? null
  const defaultWindow = meta.data?.default_window_days ?? 30
  const fallback = useMemo(() => (maxDate ? windowEndingAt(maxDate, defaultWindow) : null), [maxDate, defaultWindow])

  const rawCity = params.get('city')
  const city = cities.some((c) => c.key === rawCity) ? rawCity : 'all'
  const rawFrom = params.get('from')
  const rawTo = params.get('to')
  const validRange = isIsoDate(rawFrom) && isIsoDate(rawTo) && rawFrom <= rawTo
  const dateFrom = validRange ? rawFrom : fallback?.from ?? null
  const dateTo = validRange ? rawTo : fallback?.to ?? null
  const rawGranularity = params.get('g')
  const granularity = GRANULARITIES.includes(rawGranularity) ? rawGranularity : DEFAULT_GRANULARITY

  const update = useCallback(
    (patch) =>
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          for (const [key, value] of Object.entries(patch)) {
            if (value === null || value === undefined) next.delete(key)
            else next.set(key, value)
          }
          return next
        },
        { replace: true }, // filter tweaks should not fill the back button history
      ),
    [setParams],
  )

  return {
    city,
    dateFrom,
    dateTo,
    granularity,
    // Wait for meta even when the URL already has dates: the city can only be validated against the meta city list
    ready: meta.isSuccess && Boolean(dateFrom && dateTo),
    cities,
    minDate,
    maxDate,
    defaultWindow,
    metaQuery: meta,
    setCity: (value) => update({ city: value === 'all' ? null : value }),
    setRange: (from, to) => update({ from, to }),
    setGranularity: (value) => update({ g: value === DEFAULT_GRANULARITY ? null : value }),
    reset: () => setParams({}, { replace: true }),
  }
}
