import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../../api/endpoints'
import { ApiError } from '../../api/errors'
import ExplorerPage from './ExplorerPage'

vi.mock('../../api/endpoints')

vi.mock('../realtime/LiveRefreshProvider', () => ({
  useLive: () => ({ status: 'live', events: [] }),
}))

const TABLES = {
  tables: [
    { key: 'all', label: 'All cities', table: 'transportation.gold.fact_trips' },
    { key: 'kochi', label: 'Kochi', table: 'transportation.gold.fact_trips_kochi' },
  ],
}

const COLUMNS_ALL = {
  columns: [
    { name: 'id', type: 'string', nullable: false },
    { name: 'sales_amt', type: 'double', nullable: true },
  ],
}

const COLUMNS_KOCHI = {
  columns: [
    { name: 'id', type: 'string', nullable: false },
    { name: 'passenger_rating', type: 'double', nullable: true },
  ],
}

const SAMPLE_ALL = {
  rows: [{ id: 'trip-1', sales_amt: 420 }],
}

const SAMPLE_KOCHI = {
  rows: [{ id: 'trip-kochi-9', passenger_rating: 4.9 }],
}

function renderExplorer() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ExplorerPage />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  api.getExplorerTables.mockResolvedValue(TABLES)
  api.getExplorerColumns.mockImplementation((city) =>
    Promise.resolve(city === 'kochi' ? COLUMNS_KOCHI : COLUMNS_ALL)
  )
  api.getExplorerSample.mockImplementation((city) =>
    Promise.resolve(city === 'kochi' ? SAMPLE_KOCHI : SAMPLE_ALL)
  )
})

afterEach(cleanup)

describe('ExplorerPage', () => {
  it('loads tables, selects the first table, and displays columns and sample rows', async () => {
    renderExplorer()

    expect(await screen.findByRole('heading', { name: 'Table explorer' })).toBeInTheDocument()
    expect(await screen.findByText('All cities')).toBeInTheDocument()
    expect((await screen.findAllByText('sales_amt')).length).toBeGreaterThan(0)
    expect(await screen.findByText('trip-1')).toBeInTheDocument()

    expect(api.getExplorerColumns).toHaveBeenCalledWith('all', expect.anything())
    expect(api.getExplorerSample).toHaveBeenCalledWith('all', 25, expect.anything())
  })

  it('switches columns and sample rows when another table is selected', async () => {
    renderExplorer()
    const user = userEvent.setup()

    await screen.findByText('trip-1')
    await user.click(screen.getByRole('button', { name: /kochi/i }))

    expect(await screen.findByText('trip-kochi-9')).toBeInTheDocument()
    expect(screen.getAllByText('passenger_rating').length).toBeGreaterThan(0)
    expect(api.getExplorerColumns).toHaveBeenLastCalledWith('kochi', expect.anything())
    expect(api.getExplorerSample).toHaveBeenLastCalledWith('kochi', 25, expect.anything())
  })

  it('refetches sample rows when the row limit changes', async () => {
    renderExplorer()
    const user = userEvent.setup()

    await screen.findByText('trip-1')
    await user.selectOptions(screen.getByLabelText('Sample row limit'), '50')

    await waitFor(() =>
      expect(api.getExplorerSample).toHaveBeenLastCalledWith('all', 50, expect.anything())
    )
  })

  it('shows one error panel when loading tables fails and recovers on retry', async () => {
    api.getExplorerTables.mockRejectedValueOnce(
      new ApiError({
        status: 503,
        code: 'warehouse_unavailable',
        message: 'Warehouse paused',
      })
    )
    renderExplorer()
    const user = userEvent.setup()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(await screen.findByText('trip-1')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('keeps columns visible when only the sample query fails and retries sample', async () => {
    api.getExplorerSample.mockRejectedValueOnce(new Error('Sample query timed out'))
    renderExplorer()
    const user = userEvent.setup()

    expect(await screen.findByText('sales_amt')).toBeInTheDocument()
    expect(await screen.findByText('Could not load sample rows')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('trip-1')).toBeInTheDocument()
  })
})