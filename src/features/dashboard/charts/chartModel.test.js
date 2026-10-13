import { describe, expect, it } from 'vitest'
import { buildChartModel } from './chartModel'
import { groupMix } from './groupMix'

const RESPONSE = {
  buckets: ['2025-06-02', '2025-06-09'],
  series: [
    { category: 'Regular', trips: [1, 2], sales: [100, 200] },
    { category: 'Premium', trips: [3, 0], sales: [50, 0] },
  ],
}

describe('buildChartModel', () => {
  it('maps buckets to labels and series to stacked datasets', () => {
    const { data, options } = buildChartModel(RESPONSE, { metric: 'sales', mode: 'dark', granularity: 'weekly' })
    expect(data.labels).toEqual(['02 Jun', '09 Jun'])
    expect(data.datasets.map((d) => d.label)).toEqual(['Regular', 'Premium'])
    expect(data.datasets[0].data).toEqual([100, 200])
    expect(options.scales.x.stacked).toBe(true)
    expect(options.scales.y.stacked).toBe(true)
  })

  it('switches between sales and trips', () => {
    const { data } = buildChartModel(RESPONSE, { metric: 'trips' })
    expect(data.datasets[0].data).toEqual([1, 2])
  })

  it('uses different colors per theme so contrast holds on both', () => {
    const dark = buildChartModel(RESPONSE, { mode: 'dark' })
    const light = buildChartModel(RESPONSE, { mode: 'light' })
    expect(dark.data.datasets[0].backgroundColor).not.toBe(light.data.datasets[0].backgroundColor)
    expect(dark.options.scales.y.grid.color).not.toBe(light.options.scales.y.grid.color)
    expect(dark.data.datasets[0].backgroundColor).not.toBe(dark.data.datasets[1].backgroundColor)
  })

  it('formats tooltips and axis ticks for the chosen metric', () => {
    const sales = buildChartModel(RESPONSE, { metric: 'sales' }).options
    const label = sales.plugins.tooltip.callbacks.label
    expect(label({ dataset: { label: 'Regular' }, parsed: { y: 100 } })).toBe(' Regular: ₹100')
    expect(sales.plugins.tooltip.callbacks.footer([{ parsed: { y: 100 } }, { parsed: { y: 50 } }])).toBe('Total: ₹150')
    expect(sales.plugins.tooltip.callbacks.footer([{ parsed: { y: 100 } }])).toBe('')
    expect(sales.scales.y.ticks.callback(14250000)).toBe('₹1.4Cr')
    expect(buildChartModel(RESPONSE, { metric: 'trips' }).options.scales.y.ticks.callback(1234)).toBe('1.2K')
  })

  it('copes with a missing response', () => {
    const { data } = buildChartModel(undefined)
    expect(data).toEqual({ labels: [], datasets: [] })
  })
})

describe('groupMix', () => {
  const item = (n, sales) => ({ label: `City ${n}`, sales, trips: n, share_pct: sales })

  it('leaves short lists alone', () => {
    const items = [item(1, 50), item(2, 30), item(3, 20)]
    expect(groupMix(items)).toEqual(items)
  })

  it('does not fold a single leftover slice, "Other (1)" would save no space', () => {
    const items = Array.from({ length: 7 }, (_, i) => item(i, 10))
    expect(groupMix(items, 6)).toHaveLength(7)
  })

  it('folds the tail into one Other slice with summed numbers', () => {
    const items = Array.from({ length: 10 }, (_, i) => item(i + 1, 10 - i))
    const result = groupMix(items, 6)
    expect(result).toHaveLength(7)
    expect(result.slice(0, 6)).toEqual(items.slice(0, 6))
    expect(result[6]).toMatchObject({ label: 'Other (4)', sales: 4 + 3 + 2 + 1, trips: 7 + 8 + 9 + 10, share_pct: 10, isOther: true })
  })
})
