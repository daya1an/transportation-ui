import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { KpiGrid } from './KpiGrid'

afterEach(cleanup)

const SAMPLE_CARDS = [
  {
    key: 'sales',
    label: 'Total sales',
    icon: 'pi-wallet',
    value: '₹1.4Cr',
    fullValue: '₹1,42,35,890',
    delta: { direction: 'up', text: '+8.2%', title: 'vs prior period' },
  },
  {
    key: 'trips',
    label: 'Trips',
    icon: 'pi-car',
    value: '1.2L',
    fullValue: '1,20,400',
    delta: { direction: 'up', text: '+4.5%', title: 'vs prior period' },
  },
  {
    key: 'distance',
    label: 'Distance',
    icon: 'pi-map',
    value: '84,210 km',
    fullValue: '84,210 km',
    delta: { direction: 'down', text: '-2.1%', title: 'vs prior period' },
  },
  {
    key: 'rating',
    label: 'Avg rating',
    icon: 'pi-star',
    value: '4.6',
    fullValue: '4.62',
    subtext: 'Driver 4.7',
    delta: { direction: 'flat', text: '0.0%', title: 'No change' },
  },
]

describe('KpiGrid', () => {
  it('renders four skeleton placeholders while loading', () => {
    render(<KpiGrid loading />)

    const region = screen.getByLabelText('Loading KPIs')
    expect(region.getAttribute('aria-busy')).toBe('true')
    expect(screen.getAllByTestId('kpi-skeleton')).toHaveLength(4)
  })

  it('renders all four KPI cards inside the responsive grid', () => {
    render(<KpiGrid cards={SAMPLE_CARDS} loading={false} />)

    const region = screen.getByLabelText('Key metrics')
    expect(region.className).toContain('grid-cols-1')
    expect(region.className).toContain('sm:grid-cols-2')
    expect(region.className).toContain('xl:grid-cols-4')

    expect(screen.getByText('Total sales')).toBeTruthy()
    expect(screen.getByText('Trips')).toBeTruthy()
    expect(screen.getByText('Distance')).toBeTruthy()
    expect(screen.getByText('Avg rating')).toBeTruthy()
  })

  it('marks the grid as refreshing without hiding cards', () => {
    render(<KpiGrid cards={SAMPLE_CARDS} loading={false} refreshing />)

    const region = screen.getByLabelText('Key metrics')
    expect(region.getAttribute('data-refreshing')).toBe('true')
    expect(screen.getByText('₹1.4Cr')).toBeTruthy()
  })

  it('shows a compact error panel and triggers retry on click', () => {
    const onRetry = vi.fn()
    render(
      <KpiGrid
        error={new Error('Warehouse unavailable')}
        onRetry={onRetry}
      />
    )

    expect(screen.getByText('Could not load KPIs')).toBeTruthy()
    expect(screen.getByText('Warehouse unavailable')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})