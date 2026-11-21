import {
  formatCompact,
  formatCurrency,
  formatCurrencyCompact,
  formatKm,
  formatNumber,
  formatRating,
} from '../../../lib/format'

const COMPACT_THRESHOLD = 100_000
const FLAT_THRESHOLD = 0.05

function formatDelta(metric, formatFull) {
  const raw = metric?.change_pct
  if (raw === null || raw === undefined || Number.isNaN(Number(raw))) {
    return {
      direction: 'none',
      text: 'No prior data',
      title: 'No prior period available',
    }
  }

  const pct = Number(raw)
  const title =
    metric?.previous != null
      ? `Prior period: ${formatFull(metric.previous)}`
      : 'vs prior period'

  if (Math.abs(pct) < FLAT_THRESHOLD) {
    return { direction: 'flat', text: '0.0%', title }
  }

  if (pct > 0) {
    return { direction: 'up', text: `+${pct.toFixed(1)}%`, title }
  }

  return { direction: 'down', text: `${pct.toFixed(1)}%`, title }
}

function isCompact(value) {
  return value != null && Math.abs(Number(value)) >= COMPACT_THRESHOLD
}

export function buildKpiCards(kpis) {
  if (!kpis) return []

  const sales = kpis.total_sales ?? {}
  const trips = kpis.total_trips ?? {}
  const distance = kpis.total_distance_kms ?? {}
  const rating = kpis.avg_passenger_rating ?? {}
  const driverRating = kpis.avg_driver_rating?.value ?? kpis.avg_driver_rating

  return [
    {
      key: 'sales',
      label: 'Total sales',
      icon: 'pi-wallet',
      value: isCompact(sales.value)
        ? formatCurrencyCompact(sales.value)
        : formatCurrency(sales.value),
      fullValue: formatCurrency(sales.value),
      delta: formatDelta(sales, formatCurrency),
    },
    {
      key: 'trips',
      label: 'Trips',
      icon: 'pi-car',
      value: isCompact(trips.value)
        ? formatCompact(trips.value)
        : formatNumber(trips.value),
      fullValue: formatNumber(trips.value),
      delta: formatDelta(trips, formatNumber),
    },
    {
      key: 'distance',
      label: 'Distance',
      icon: 'pi-map',
      value: isCompact(distance.value)
        ? `${formatCompact(distance.value)} km`
        : formatKm(distance.value),
      fullValue: formatKm(distance.value),
      delta: formatDelta(distance, formatKm),
    },
    {
      key: 'rating',
      label: 'Avg rating',
      icon: 'pi-star',
      value: formatRating(rating.value),
      fullValue: formatRating(rating.value),
      ...(driverRating != null
        ? { subtext: `Driver ${formatRating(driverRating)}` }
        : {}),
      delta: formatDelta(rating, formatRating),
    },
  ]
}