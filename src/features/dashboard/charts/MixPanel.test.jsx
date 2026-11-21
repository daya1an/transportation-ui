import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { formatCurrencyCompact } from '../../../lib/format'

const chartSpy = vi.fn()

vi.mock('primereact/chart', () => ({
  Chart: (props) => {
    chartSpy(props)
    return <div data-testid="prime-mix-chart" data-type={props.type} />
  },
}))

import { MixPanel } from './MixPanel'

const RESPONSE = {
  items: [
    { label: 'Jaipur', sales: 1_500_000, trips: 4200, share_pct: 60 },
    { label: 'Kochi', sales: 750_000, trips: 2100, share_pct: 30 },
    { label: 'Mysore', sales: 250_000, trips: 700, share_pct: 10 },
  ],
}

beforeEach(() => {
  chartSpy.mockClear()
})

afterEach(cleanup)

describe('MixPanel', () => {
  it('renders a doughnut chart and breakdown rows with totals', () => {
    render(<MixPanel response={RESPONSE} mode="dark" subtitle="By city" />)

    expect(screen.getByTestId('prime-mix-chart').getAttribute('data-type')).toBe('doughnut')
    expect(screen.getByText('By city')).toBeTruthy()
    expect(screen.getByText('Jaipur')).toBeTruthy()
    expect(screen.getByText('60.0%')).toBeTruthy()
    expect(screen.getByText(formatCurrencyCompact(2_500_000))).toBeTruthy()

    const lastCall = chartSpy.mock.calls.at(-1)[0]
    expect(lastCall.data.labels).toEqual(['Jaipur', 'Kochi', 'Mysore'])
    expect(lastCall.data.datasets[0].data).toEqual([1_500_000, 750_000, 250_000])
  })

  it('folds more than seven items into top six plus an Other slice', () => {
    const many = {
      items: Array.from({ length: 10 }, (_, i) => ({
        label: `City ${i + 1}`,
        sales: (10 - i) * 1000,
        trips: 100,
        share_pct: 10,
      })),
    }

    render(<MixPanel response={many} mode="dark" />)

    expect(screen.getByText('Other (4)')).toBeTruthy()
    expect(screen.queryByText('City 7')).toBeNull()
    const lastCall = chartSpy.mock.calls.at(-1)[0]
    expect(lastCall.data.labels).toHaveLength(7)
  })

  it('updates palette colors when switching between dark and light themes', () => {
    const { rerender } = render(<MixPanel response={RESPONSE} mode="dark" />)
    const darkColors = chartSpy.mock.calls.at(-1)[0].data.datasets[0].backgroundColor

    rerender(<MixPanel response={RESPONSE} mode="light" />)
    const lightColors = chartSpy.mock.calls.at(-1)[0].data.datasets[0].backgroundColor

    expect(darkColors[0]).not.toBe(lightColors[0])
  })

  it('shows an empty message when there are no items', () => {
    render(<MixPanel response={{ items: [] }} />)

    expect(screen.queryByTestId('prime-mix-chart')).toBeNull()
    expect(screen.getByText('No sales mix data for the selected filters.')).toBeTruthy()
  })

  it('renders a loading skeleton and supports refreshing state without hiding rows', () => {
    const { rerender } = render(<MixPanel loading />)

    expect(screen.getByTestId('mix-skeleton').getAttribute('aria-busy')).toBe('true')
    expect(screen.queryByTestId('prime-mix-chart')).toBeNull()

    rerender(<MixPanel response={RESPONSE} refreshing />)
    const chart = screen.getByTestId('prime-mix-chart')
    expect(chart.closest('[data-refreshing]').getAttribute('data-refreshing')).toBe('true')
    expect(screen.getByText('Jaipur')).toBeTruthy()
  })

  it('shows a compact error panel and triggers retry on click', () => {
    const onRetry = vi.fn()
    render(
      <MixPanel
        error={new Error('Warehouse unavailable')}
        onRetry={onRetry}
      />
    )

    expect(screen.getByText('Could not load sales mix')).toBeTruthy()
    expect(screen.getByText('Warehouse unavailable')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})