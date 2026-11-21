import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TableList } from './TableList'

afterEach(cleanup)

const TABLES = [
  { key: 'all', label: 'All cities', table: 'fact_trips', row_count: 356000 },
  { key: 'kochi', label: 'Kochi', table: 'fact_trips_kochi', row_count: 42100 },
  { key: 'jaipur', label: 'Jaipur', table: 'fact_trips_jaipur' },
]

describe('TableList', () => {
  it('renders table labels, technical names, counts, and highlights the selected table', () => {
    render(<TableList tables={TABLES} selectedKey="kochi" />)

    expect(screen.getByText('3 tables')).toBeTruthy()
    expect(screen.getByText('All cities')).toBeTruthy()
    expect(screen.getByText('fact_trips_kochi')).toBeTruthy()
    expect(screen.getByText('3,56,000')).toBeTruthy()

    const kochiButton = screen.getByRole('button', { name: /kochi/i })
    const allButton = screen.getByRole('button', { name: /all cities/i })
    expect(kochiButton.getAttribute('aria-pressed')).toBe('true')
    expect(allButton.getAttribute('aria-pressed')).toBe('false')
  })

  it('calls onSelect with the city key when clicked', () => {
    const onSelect = vi.fn()
    render(<TableList tables={TABLES} selectedKey="all" onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('button', { name: /jaipur/i }))
    expect(onSelect).toHaveBeenCalledWith('jaipur')
  })

  it('renders loading skeletons while loading', () => {
    render(<TableList loading />)

    const skeleton = screen.getByTestId('table-list-skeleton')
    expect(skeleton.getAttribute('aria-busy')).toBe('true')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders an empty message when there are no tables', () => {
    render(<TableList tables={[]} />)
    expect(screen.getByText('No tables available.')).toBeTruthy()
  })

  it('renders a compact error panel and invokes onRetry when clicked', () => {
    const onRetry = vi.fn()
    render(
      <TableList
        error={new Error('Warehouse unavailable')}
        onRetry={onRetry}
      />
    )

    expect(screen.getByText('Could not load tables')).toBeTruthy()
    expect(screen.getByText('Warehouse unavailable')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})