import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SamplePanel } from './SamplePanel'

afterEach(cleanup)

const SAMPLE_ROWS = [
  {
    id: 'trip-1',
    business_date: '2025-12-20',
    city_name: 'Kochi',
    sales_amt: 420,
    passenger_rating: null,
  },
  {
    id: 'trip-2',
    business_date: '2025-12-19',
    city_name: 'Jaipur',
    sales_amt: 950,
    passenger_rating: 4.8,
  },
]

describe('SamplePanel', () => {
  it('renders headers, values, null placeholders, and row count from object rows', () => {
    render(
      <SamplePanel
        rows={SAMPLE_ROWS}
        tableName="transportation.gold.fact_trips_kochi"
        limit={25}
      />
    )

    expect(screen.getByText('2 rows')).toBeTruthy()
    expect(screen.getByText('transportation.gold.fact_trips_kochi')).toBeTruthy()
    expect(screen.getByText('business_date')).toBeTruthy()
    expect(screen.getByText('Kochi')).toBeTruthy()
    expect(screen.getByText('950')).toBeTruthy()
    expect(screen.getByText('-')).toBeTruthy()
  })

  it('supports array rows paired with explicit column names', () => {
    render(
      <SamplePanel
        columns={['id', 'city_name', 'active']}
        rows={[['t-9', 'Surat', true]]}
      />
    )

    expect(screen.getByText('1 row')).toBeTruthy()
    expect(screen.getByText('t-9')).toBeTruthy()
    expect(screen.getByText('Surat')).toBeTruthy()
    expect(screen.getByText('true')).toBeTruthy()
  })

  it('calls onLimitChange when selecting a different row limit', () => {
    const onLimitChange = vi.fn()
    render(
      <SamplePanel
        rows={SAMPLE_ROWS}
        limit={25}
        onLimitChange={onLimitChange}
      />
    )

    fireEvent.change(screen.getByLabelText('Sample row limit'), {
      target: { value: '50' },
    })
    expect(onLimitChange).toHaveBeenCalledWith(50)
  })

  it('renders loading skeletons and marks refreshing without hiding previous rows', () => {
    const { rerender } = render(<SamplePanel loading />)

    expect(
      screen.getByTestId('sample-skeleton').getAttribute('aria-busy')
    ).toBe('true')
    expect(screen.queryByTestId('sample-table-wrap')).toBeNull()

    rerender(<SamplePanel rows={SAMPLE_ROWS} refreshing />)
    expect(
      screen.getByTestId('sample-table-wrap').getAttribute('data-refreshing')
    ).toBe('true')
    expect(screen.getByText('Kochi')).toBeTruthy()
  })

  it('renders an empty message when there are no sample rows', () => {
    render(<SamplePanel rows={[]} />)
    expect(screen.getByText('No sample rows available for this table.')).toBeTruthy()
  })

  it('renders a compact error panel and triggers retry on click', () => {
    const onRetry = vi.fn()
    render(
      <SamplePanel
        error={new Error('Warehouse unavailable')}
        onRetry={onRetry}
      />
    )

    expect(screen.getByText('Could not load sample rows')).toBeTruthy()
    expect(screen.getByText('Warehouse unavailable')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})