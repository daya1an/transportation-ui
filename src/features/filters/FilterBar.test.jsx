import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../../api/endpoints'
import DateRangeFilter from './DateRangeFilter'
import FilterBar from './FilterBar'
import { useFilters } from './useFilters'

vi.mock('../../api/endpoints')
// The real calendar is heavy to drive in jsdom. This stand-in lets us play the part of the user's picks.
vi.mock('primereact/calendar', () => ({
  Calendar: ({ onChange, value }) => (
    <div>
      <button onClick={() => onChange({ value: [new Date(2025, 9, 1), null] })}>pick first day</button>
      <button onClick={() => onChange({ value: [new Date(2025, 9, 1), new Date(2025, 9, 31)] })}>pick range</button>
      <span data-testid="calendar-value">{value ? value.map((d) => d?.toDateString()).join(' to ') : 'none'}</span>
    </div>
  ),
}))

const META = {
  cities: [
    { key: 'all', label: 'All cities' },
    { key: 'kochi', label: 'Kochi' },
    { key: 'surat', label: 'Surat' },
  ],
  min_date: '2025-08-01',
  max_date: '2025-12-27',
  default_window_days: 30,
  data_version: 'v@1.0',
}

function Harness({ children }) {
  const filters = useFilters()
  const { search } = useLocation()
  return (
    <>
      {filters.ready && children(filters)}
      <output data-testid="url">{search}</output>
    </>
  )
}

// The accessible input inside PrimeReact's dropdown ignores pointer events. Real users click the visible label.
const openCityMenu = (user) => user.click(screen.getByLabelText('City').closest('.p-dropdown').querySelector('.p-dropdown-label'))

async function setup(children) {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <Harness>{children}</Harness>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await screen.findByTestId('url')
  await waitFor(() => expect(screen.getByRole('button', { name: /90 days/i })).toBeInTheDocument())
  return { user: userEvent.setup(), url: () => screen.getByTestId('url').textContent }
}

beforeEach(() => {
  vi.resetAllMocks()
  api.getMeta.mockResolvedValue(META)
})

describe('FilterBar', () => {
  it('quick ranges set the date range in the URL', async () => {
    const { user, url } = await setup((f) => <FilterBar filters={f} />)
    await user.click(screen.getByRole('button', { name: /90 days/i }))
    expect(url()).toContain('from=2025-09-29')
    expect(url()).toContain('to=2025-12-27')

    await user.click(screen.getByRole('button', { name: /^all$/i }))
    expect(url()).toContain('from=2025-08-01')

    await user.click(screen.getByRole('button', { name: /30 days/i }))
    expect(url()).toContain('from=2025-11-28')
  })

  it('the zoom toggle writes the granularity, and monthly (the default) leaves the URL clean', async () => {
    const { user, url } = await setup((f) => <FilterBar filters={f} />)
    await user.click(screen.getByRole('button', { name: /weekly/i }))
    expect(url()).toContain('g=weekly')
    await user.click(screen.getByRole('button', { name: /monthly/i }))
    expect(url()).not.toContain('g=')
  })

  it('choosing a city writes it to the URL, and "All cities" removes it', async () => {
    const { user, url } = await setup((f) => <FilterBar filters={f} />)
    await openCityMenu(user)
    await user.click(await screen.findByRole('option', { name: 'Kochi', hidden: true }))
    expect(url()).toContain('city=kochi')

    await openCityMenu(user)
    await user.click(await screen.findByRole('option', { name: 'All cities', hidden: true }))
    expect(url()).not.toContain('city')
  })
})

describe('DateRangeFilter', () => {
  it('waits for the second day before changing the range', async () => {
    const { user, url } = await setup((f) => <DateRangeFilter filters={f} />)
    await user.click(screen.getByText('pick first day'))
    expect(url()).not.toContain('from=2025-10-01') // half-finished, nothing applied yet
    expect(screen.getByTestId('calendar-value')).toHaveTextContent('Wed Oct 01 2025 to') // but the pick stays visible

    await user.click(screen.getByText('pick range'))
    expect(url()).toContain('from=2025-10-01')
    expect(url()).toContain('to=2025-10-31')
  })
})
