import { describe, expect, it } from 'vitest'
import {
  formatCompact,
  formatCurrency,
  formatCurrencyCompact,
  formatKm,
  formatNumber,
  formatRating,
} from '../../../lib/format'
import { buildKpiCards } from './kpiModel'

const SAMPLE_KPIS = {
  total_sales: { value: 14_235_890, change_pct: 8.24, previous: 13_152_000 },
  total_trips: { value: 120_400, change_pct: -2.15, previous: 123_045 },
  total_distance_kms: { value: 84_210, change_pct: 0.03, previous: 84_185 },
  avg_passenger_rating: { value: 4.62, change_pct: null, previous: null },
  avg_driver_rating: { value: 4.71 },
}

describe('buildKpiCards', () => {
  it('returns four cards in order with the expected keys and icons', () => {
    const cards = buildKpiCards(SAMPLE_KPIS)
    expect(cards.map((c) => c.key)).toEqual(['sales', 'trips', 'distance', 'rating'])
    expect(cards.map((c) => c.icon)).toEqual(['pi-wallet', 'pi-car', 'pi-map', 'pi-star'])
  })

  it('keeps full digits under 1,00,000 for sales, trips and distance', () => {
    const cards = buildKpiCards({
      total_sales: { value: 99_999, change_pct: 1.5 },
      total_trips: { value: 45_200, change_pct: 1.5 },
      total_distance_kms: { value: 84_210, change_pct: 1.5 },
      avg_passenger_rating: { value: 4.5, change_pct: 0 },
    })

    expect(cards[0].value).toBe(formatCurrency(99_999))
    expect(cards[1].value).toBe(formatNumber(45_200))
    expect(cards[2].value).toBe(formatKm(84_210))
  })

  it('uses compact headlines from 1,00,000 up and preserves fullValue for tooltips', () => {
    const cards = buildKpiCards({
      total_sales: { value: 14_235_890, change_pct: 5 },
      total_trips: { value: 120_400, change_pct: 5 },
      total_distance_kms: { value: 250_000, change_pct: 5 },
      avg_passenger_rating: { value: 4.6, change_pct: 0 },
    })

    expect(cards[0].value).toBe(formatCurrencyCompact(14_235_890))
    expect(cards[0].fullValue).toBe(formatCurrency(14_235_890))
    expect(cards[1].value).toBe(formatCompact(120_400))
    expect(cards[1].fullValue).toBe(formatNumber(120_400))
    expect(cards[2].value).toBe(`${formatCompact(250_000)} km`)
    expect(cards[2].fullValue).toBe(formatKm(250_000))
  })

  it('marks positive changes as up with a leading plus sign', () => {
    const [sales] = buildKpiCards(SAMPLE_KPIS)
    expect(sales.delta.direction).toBe('up')
    expect(sales.delta.text).toBe('+8.2%')
  })

  it('marks negative changes as down with a minus sign', () => {
    const [, trips] = buildKpiCards(SAMPLE_KPIS)
    expect(trips.delta.direction).toBe('down')
    expect(trips.delta.text).toBe('-2.1%')
  })

  it('treats changes under 0.05% as flat', () => {
    const cards = buildKpiCards({
      total_sales: { value: 50_000, change_pct: 0.04 },
      total_trips: { value: 500, change_pct: -0.049 },
      total_distance_kms: { value: 1_000, change_pct: 0 },
      avg_passenger_rating: { value: 4.5, change_pct: 0.05 },
    })

    expect(cards[0].delta).toMatchObject({ direction: 'flat', text: '0.0%' })
    expect(cards[1].delta).toMatchObject({ direction: 'flat', text: '0.0%' })
    expect(cards[2].delta).toMatchObject({ direction: 'flat', text: '0.0%' })
    expect(cards[3].delta).toMatchObject({ direction: 'up', text: '+0.1%' })
  })

  it('marks null change_pct as none with no prior data text', () => {
    const [, , , rating] = buildKpiCards(SAMPLE_KPIS)
    expect(rating.delta.direction).toBe('none')
    expect(rating.delta.text).toBe('No prior data')
  })

  it('includes the prior period value in delta.title when present', () => {
    const [sales] = buildKpiCards(SAMPLE_KPIS)
    expect(sales.delta.title).toContain(formatCurrency(13_152_000))
  })

  it('adds driver rating subtext when avg_driver_rating is provided', () => {
    const [, , , rating] = buildKpiCards(SAMPLE_KPIS)
    expect(rating.subtext).toBe(`Driver ${formatRating(4.71)}`)
  })

  it('omits subtext when driver rating is absent and returns empty array for null input', () => {
    expect(buildKpiCards(null)).toEqual([])
    const [, , , rating] = buildKpiCards({
      ...SAMPLE_KPIS,
      avg_driver_rating: undefined,
    })
    expect(rating.subtext).toBeUndefined()
  })
})