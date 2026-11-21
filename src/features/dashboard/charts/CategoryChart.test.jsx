import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

const chartSpy = vi.fn()

vi.mock('primereact/chart', () => ({
  Chart: (props) => {
    chartSpy(props)
    return <div data-testid="prime-chart" data-type={props.type} />
  },
}))

import { CategoryChart } from './CategoryChart'

const RESPONSE = {
  buckets: ['2025-06-02', '2025-06-09'],
  series: [
    { category: 'Regular', trips: [12, 18], sales: [1200, 1800] },
    { category: 'Premium', trips: [5, 7], sales: [900, 1400] },
  ],
}

beforeEach(() => {
  chartSpy.mockClear()
})

afterEach(cleanup)

describe('CategoryChart', () => {
  it('renders a stacked bar chart with Sales active by default', () => {
    render(<CategoryChart response={RESPONSE} granularity="weekly" mode="dark" />)

    expect(screen.getByTestId('prime-chart').getAttribute('data-type')).toBe('bar')
    expect(screen.getByRole('button', { name: 'Sales' }).getAttribute('aria-pressed')).toBe('true')

    const lastCall = chartSpy.mock.calls.at(-1)[0]
    expect(lastCall.data.labels).toEqual(['02 Jun', '09 Jun'])
    expect(lastCall.data.datasets[0].data).toEqual([1200, 1800])
    expect(lastCall.options.scales.x.stacked).toBe(true)
    expect(lastCall.options.scales.y.stacked).toBe(true)
  })

  it('switches dataset values when toggled to Trips', () => {
    render(<CategoryChart response={RESPONSE} granularity="weekly" mode="dark" />)

    fireEvent.click(screen.getByRole('button', { name: 'Trips' }))

    expect(screen.getByRole('button', { name: 'Trips' }).getAttribute('aria-pressed')).toBe('true')
    const lastCall = chartSpy.mock.calls.at(-1)[0]
    expect(lastCall.data.datasets[0].data).toEqual([12, 18])
    expect(lastCall.data.datasets[1].data).toEqual([5, 7])
  })

  it('keeps the active metric selected when clicked again', () => {
    render(<CategoryChart response={RESPONSE} />)

    fireEvent.click(screen.getByRole('button', { name: 'Sales' }))

    expect(screen.getByRole('button', { name: 'Sales' }).getAttribute('aria-pressed')).toBe('true')
    const lastCall = chartSpy.mock.calls.at(-1)[0]
    expect(lastCall.data.datasets[0].data).toEqual([1200, 1800])
  })

  it('updates palette and grid colors when theme mode changes', () => {
    const { rerender } = render(<CategoryChart response={RESPONSE} mode="dark" />)
    const darkCall = chartSpy.mock.calls.at(-1)[0]

    rerender(<CategoryChart response={RESPONSE} mode="light" />)
    const lightCall = chartSpy.mock.calls.at(-1)[0]

    expect(darkCall.data.datasets[0].backgroundColor).not.toBe(
      lightCall.data.datasets[0].backgroundColor
    )
    expect(darkCall.options.scales.y.grid.color).not.toBe(
      lightCall.options.scales.y.grid.color
    )
  })

  it('shows an empty message when there are no buckets to plot', () => {
    render(<CategoryChart response={{ buckets: [], series: [] }} />)

    expect(screen.queryByTestId('prime-chart')).toBeNull()
    expect(screen.getByText('No chart data for the selected filters.')).toBeTruthy()
  })

  it('renders a loading skeleton while loading', () => {
    render(<CategoryChart loading />)

    const skeleton = screen.getByTestId('chart-skeleton')
    expect(skeleton.getAttribute('aria-busy')).toBe('true')
    expect(screen.queryByTestId('prime-chart')).toBeNull()
  })

  it('marks the chart as refreshing without hiding previous data', () => {
    render(<CategoryChart response={RESPONSE} refreshing />)

    const chart = screen.getByTestId('prime-chart')
    expect(chart.parentElement.getAttribute('data-refreshing')).toBe('true')
  })

  it('shows a compact error panel and calls onRetry when clicked', () => {
    const onRetry = vi.fn()
    render(
      <CategoryChart
        error={new Error('Warehouse unavailable')}
        onRetry={onRetry}
      />
    )

    expect(screen.getByText('Could not load chart')).toBeTruthy()
    expect(screen.getByText('Warehouse unavailable')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})