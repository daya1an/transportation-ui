import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { formatDate } from '../../../lib/dates'
import { formatCurrency, formatKm, formatRating } from '../../../lib/format'
import { TripsTable } from './TripsTable'

afterEach(cleanup)

const SAMPLE_ROWS = [
  {
    id: 'trip-101',
    business_date: '2025-12-20',
    city_name: 'Kochi',
    passenger_category: 'Regular',
    distance_kms: 14.5,
    sales_amt: 420,
    passenger_rating: 4.8,
    driver_rating: 4.9,
  },
  {
    id: 'trip-102',
    business_date: '2025-12-19',
    city_name: 'Jaipur',
    passenger_category: 'Premium',
    distance_kms: 28,
    sales_amt: 950,
    passenger_rating: 4.5,
    driver_rating: 4.7,
  },
]

describe('TripsTable', () => {
  it('renders formatted trip rows and total trip count', () => {
    render(
      <TripsTable
        rows={SAMPLE_ROWS}
        total={1250}
        page={1}
        pageSize={25}
        subtitle="Filtered results"
      />
    )

    expect(screen.getByText('Filtered results')).toBeTruthy()
    expect(screen.getByText('1,250 trips')).toBeTruthy()
    expect(screen.getByText(formatDate('2025-12-20'))).toBeTruthy()
    expect(screen.getByText('Kochi')).toBeTruthy()
    expect(screen.getByText('Regular')).toBeTruthy()
    expect(screen.getByText(formatKm(14.5))).toBeTruthy()
    expect(screen.getByText(formatCurrency(420))).toBeTruthy()
    expect(screen.getByText(formatRating(4.8))).toBeTruthy()
    expect(screen.getByText(formatRating(4.9))).toBeTruthy()
  })

  it('calls onPageChange when moving to the next page', () => {
    const onPageChange = vi.fn()
    render(
      <TripsTable
        rows={SAMPLE_ROWS}
        total={100}
        page={1}
        pageSize={25}
        onPageChange={onPageChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /next page/i }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onSortChange with ascending order when clicking an unsorted column', () => {
    const onSortChange = vi.fn()
    render(
      <TripsTable
        rows={SAMPLE_ROWS}
        total={2}
        sortBy="business_date"
        sortDir="desc"
        onSortChange={onSortChange}
      />
    )

    fireEvent.click(screen.getByText('Sales').closest('th'))
    expect(onSortChange).toHaveBeenCalledWith({
      sortBy: 'sales_amt',
      sortDir: 'asc',
    })
  })

  it('toggles sort direction when clicking the active sorted column', () => {
    const onSortChange = vi.fn()
    render(
      <TripsTable
        rows={SAMPLE_ROWS}
        total={2}
        sortBy="business_date"
        sortDir="desc"
        onSortChange={onSortChange}
      />
    )

    fireEvent.click(screen.getByText('Date').closest('th'))
    expect(onSortChange).toHaveBeenCalledWith({
      sortBy: 'business_date',
      sortDir: 'asc',
    })
  })

  it('shows the empty message when there are no rows', () => {
    render(<TripsTable rows={[]} total={0} />)
    expect(screen.getByText('No trips match the selected filters.')).toBeTruthy()
  })

  it('updates search text and clears it with the clear button', () => {
    const onSearchChange = vi.fn()
    const { rerender } = render(
      <TripsTable
        rows={SAMPLE_ROWS}
        total={2}
        search=""
        onSearchChange={onSearchChange}
      />
    )

    fireEvent.change(screen.getByLabelText('Search trips'), {
      target: { value: 'Kochi' },
    })
    expect(onSearchChange).toHaveBeenCalledWith('Kochi')

    rerender(
      <TripsTable
        rows={SAMPLE_ROWS}
        total={2}
        search="Kochi"
        onSearchChange={onSearchChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(onSearchChange).toHaveBeenCalledWith('')
  })

  it('calls onPageSizeChange when selecting a different page size', () => {
    const onPageSizeChange = vi.fn()
    render(
      <TripsTable
        rows={SAMPLE_ROWS}
        total={100}
        pageSize={25}
        onPageSizeChange={onPageSizeChange}
      />
    )

    fireEvent.change(screen.getByLabelText('Rows per page'), {
      target: { value: '50' },
    })
    expect(onPageSizeChange).toHaveBeenCalledWith(50)
  })

  it('shows a search-specific empty message when search has no matches', () => {
    render(<TripsTable rows={[]} total={0} search="Nowhere" />)
    expect(screen.getByText('No trips match your search.')).toBeTruthy()
  })

  it('renders loading skeleton rows and marks refreshing without hiding data', () => {
    const { rerender } = render(<TripsTable loading />)

    expect(screen.getByTestId('trips-skeleton').getAttribute('aria-busy')).toBe('true')
    expect(screen.queryByTestId('trips-table-wrap')).toBeNull()

    rerender(<TripsTable rows={SAMPLE_ROWS} total={2} refreshing />)
    expect(screen.getByTestId('trips-table-wrap').getAttribute('data-refreshing')).toBe('true')
    expect(screen.getByText('Kochi')).toBeTruthy()
  })

  it('shows a compact error panel and triggers retry on click', () => {
    const onRetry = vi.fn()
    render(
      <TripsTable
        error={new Error('Warehouse unavailable')}
        onRetry={onRetry}
      />
    )

    expect(screen.getByText('Could not load trips')).toBeTruthy()
    expect(screen.getByText('Warehouse unavailable')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})