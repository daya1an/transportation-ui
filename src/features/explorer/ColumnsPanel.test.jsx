import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ColumnsPanel } from './ColumnsPanel'

afterEach(cleanup)

const COLUMNS = [
  { name: 'id', type: 'string', nullable: false, comment: 'Trip identifier' },
  { col_name: 'business_date', data_type: 'date', nullable: false },
  { column_name: 'sales_amt', data_type: 'double', nullable: true, description: 'Fare amount' },
]

describe('ColumnsPanel', () => {
  it('renders normalized column names, types, descriptions, and table subtitle', () => {
    render(
      <ColumnsPanel
        columns={COLUMNS}
        tableName="transportation.gold.fact_trips_kochi"
      />
    )

    expect(screen.getByText('3 columns')).toBeTruthy()
    expect(screen.getByText('transportation.gold.fact_trips_kochi')).toBeTruthy()
    expect(screen.getByText('id')).toBeTruthy()
    expect(screen.getByText('business_date')).toBeTruthy()
    expect(screen.getByText('sales_amt')).toBeTruthy()
    expect(screen.getByText('double')).toBeTruthy()
    expect(screen.getByText('Trip identifier')).toBeTruthy()
    expect(screen.getByText('Fare amount')).toBeTruthy()
    expect(screen.getAllByText('not null')).toHaveLength(2)
  })

  it('omits the description column when no comments are provided', () => {
    render(
      <ColumnsPanel
        columns={[
          { name: 'city_id', type: 'string' },
          { name: 'distance_kms', type: 'double' },
        ]}
      />
    )

    expect(screen.getByText('2 columns')).toBeTruthy()
    expect(screen.queryByText('Description')).toBeNull()
  })

  it('renders loading skeletons while loading', () => {
    render(<ColumnsPanel loading />)

    const skeleton = screen.getByTestId('columns-skeleton')
    expect(skeleton.getAttribute('aria-busy')).toBe('true')
    expect(screen.queryByTestId('columns-table-wrap')).toBeNull()
  })

  it('marks the table as refreshing without hiding previous columns', () => {
    render(<ColumnsPanel columns={COLUMNS} refreshing />)

    expect(
      screen.getByTestId('columns-table-wrap').getAttribute('data-refreshing')
    ).toBe('true')
    expect(screen.getByText('business_date')).toBeTruthy()
  })

  it('renders an empty message when there are no columns', () => {
    render(<ColumnsPanel columns={[]} />)
    expect(screen.getByText('No columns available for this table.')).toBeTruthy()
  })

  it('renders a compact error panel and triggers retry on click', () => {
    const onRetry = vi.fn()
    render(
      <ColumnsPanel
        error={new Error('Warehouse unavailable')}
        onRetry={onRetry}
      />
    )

    expect(screen.getByText('Could not load columns')).toBeTruthy()
    expect(screen.getByText('Warehouse unavailable')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})