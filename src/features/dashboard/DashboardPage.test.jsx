import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../../api/endpoints'
import { ApiError } from '../../api/errors'
import AppRoutes from '../../App'
import { ToastProvider } from '../../components/ToastProvider'
import { describeExportError, saveBlob } from '../../lib/download'
import { formatCurrencyCompact } from '../../lib/format'
import { FakeEventSource } from '../../test/fakeEventSource'
import { AuthProvider } from '../auth/AuthProvider'
import { ThemeProvider } from '../theme/ThemeProvider'

vi.mock('../../api/endpoints')

vi.mock('primereact/chart', () => ({
  Chart: ({ type }) => <div data-testid={`prime-chart-${type}`} />,
}))

vi.mock('../../lib/download', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, saveBlob: vi.fn() }
})

const META = {
  min_date: '2025-08-01',
  max_date: '2025-12-27',
  data_version: 'transportation.silver.trips@4.0',
  default_window_days: 30,
  cities: [
    { key: 'all', label: 'All cities' },
    { key: 'kochi', label: 'Kochi' },
    { key: 'surat', label: 'Surat' },
  ],
}
const KPIS = {
  total_sales: { value: 12345678.4 },
  total_trips: { value: 7 },
  total_distance_kms: { value: 50 },
  avg_passenger_rating: { value: 4.5 },
}
const SALES_HEADLINE = formatCurrencyCompact(KPIS.total_sales.value)
const MIX_RESPONSE = {
  items: [
    { label: 'Jaipur', sales: 1500000, trips: 4200, share_pct: 60 },
    { label: 'Kochi', sales: 1000000, trips: 2800, share_pct: 40 },
  ],
}
const TRIPS_RESPONSE = {
  items: [
    {
      id: 'trip-1',
      business_date: '2025-12-20',
      city_name: 'Surat',
      passenger_category: 'Business',
      distance_kms: 18.2,
      sales_amt: 850,
      passenger_rating: 4.7,
      driver_rating: 4.8,
    },
  ],
  total: 1,
}

function renderApp() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <QueryClientProvider
          client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
        >
          <AuthProvider>
            <MemoryRouter initialEntries={['/']}>
              <AppRoutes />
            </MemoryRouter>
          </AuthProvider>
        </QueryClientProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  FakeEventSource.reset()
  vi.stubGlobal('EventSource', FakeEventSource)
  api.getAuthConfig.mockResolvedValue({ auth_required: false })
  api.getMeta.mockResolvedValue(META)
  api.getKpis.mockResolvedValue(KPIS)
  api.getChart.mockResolvedValue({ buckets: [], series: [] })
  api.getMix.mockResolvedValue(MIX_RESPONSE)
  api.getTrips.mockResolvedValue(TRIPS_RESPONSE)
})
afterEach(() => vi.unstubAllGlobals())

describe('dashboard shell and page', () => {
  it('shows data, theme switch and connection state, and no sign-out when auth is off', async () => {
    renderApp()
    expect(await screen.findByText(/through/i)).toHaveTextContent(
      'Data from 2025-08-01 through 2025-12-27'
    )
    expect(screen.getByText('2 cities')).toBeInTheDocument()
    expect(await screen.findByText(SALES_HEADLINE)).toBeInTheDocument()
    expect(screen.getByText('Connecting')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /switch to (dark|light) theme/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
  })

  it('shows the server error message when a query fails', async () => {
    api.getKpis.mockRejectedValue(
      new ApiError({ status: 502, code: 'query_failed', message: 'Data query failed' })
    )
    renderApp()
    expect(await screen.findByText('Data query failed')).toBeInTheDocument()
  })

  it('goes live, then refetches and logs the update when a refresh event arrives', async () => {
    renderApp()
    await screen.findByText(SALES_HEADLINE)
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))

    act(() => FakeEventSource.instances[0].open())
    expect(await screen.findByText('Live')).toBeInTheDocument()
    expect(api.getKpis).toHaveBeenCalledTimes(1)

    api.getKpis.mockResolvedValue({ ...KPIS, total_trips: { value: 8 } })
    act(() =>
      FakeEventSource.instances[0].emit(
        'refresh',
        JSON.stringify({ source: 'webhook', tables: ['fact_trips_kochi'] })
      )
    )

    await waitFor(() => expect(api.getKpis).toHaveBeenCalledTimes(2))
    expect(await screen.findByText(/webhook · fact_trips_kochi/)).toBeInTheDocument()
    expect(await screen.findByText('8')).toBeInTheDocument()
  })

  it('quick date ranges drive the data requests', async () => {
    renderApp()
    const user = userEvent.setup()
    await screen.findByText(SALES_HEADLINE)
    expect(api.getKpis).toHaveBeenLastCalledWith(
      expect.objectContaining({ city: 'all', dateFrom: '2025-11-28', dateTo: '2025-12-27' }),
      expect.anything()
    )

    await user.click(screen.getByRole('button', { name: /90 days/i }))
    await waitFor(() =>
      expect(api.getKpis).toHaveBeenLastCalledWith(
        expect.objectContaining({ dateFrom: '2025-09-29', dateTo: '2025-12-27' }),
        expect.anything()
      )
    )
  })

  it('shows one clear error with Try again when the warehouse is down, instead of an endless spinner', async () => {
    api.getMeta.mockRejectedValueOnce(
      new ApiError({
        status: 503,
        code: 'warehouse_unavailable',
        retryAfter: 5,
        message: 'The Databricks SQL warehouse is not accepting connections right now.',
      })
    )
    renderApp()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('The data warehouse is not responding')
    expect(screen.queryByRole('button', { name: /weekly/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
    expect(api.getMeta).toHaveBeenCalledTimes(1)

    await userEvent.setup().click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText(SALES_HEADLINE)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows the page title and the filter controls', async () => {
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Trips dashboard' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /weekly/i })).toBeInTheDocument()
    expect(screen.getByLabelText('City')).toBeInTheDocument()
  })

  it('renders trip rows and forwards sort updates to getTrips', async () => {
    renderApp()
    const user = userEvent.setup()
    expect(await screen.findByText('Business')).toBeInTheDocument()

    await user.click(screen.getByRole('columnheader', { name: /sales/i }))
    await waitFor(() =>
      expect(api.getTrips).toHaveBeenLastCalledWith(
        expect.objectContaining({ city: 'all', dateFrom: '2025-11-28', dateTo: '2025-12-27' }),
        expect.objectContaining({ sortBy: 'sales_amt', sortDir: 'asc', page: 1 }),
        expect.anything()
      )
    )
  })

  it('exports filtered trips as CSV and shows a success toast', async () => {
    const blob = new Blob(['id,sales_amt\n1,850'], { type: 'text/csv' })
    api.downloadTripsCsv.mockResolvedValueOnce({ blob, filename: 'trips_all.csv' })
    renderApp()
    const user = userEvent.setup()

    await screen.findByText('Business')
    await user.click(screen.getByRole('button', { name: /export csv/i }))

    await waitFor(() =>
      expect(api.downloadTripsCsv).toHaveBeenCalledWith(
        { city: 'all', dateFrom: '2025-11-28', dateTo: '2025-12-27' },
        expect.any(AbortSignal)
      )
    )
    expect(saveBlob).toHaveBeenCalledWith(blob, 'trips_all.csv')
    expect(await screen.findByText('Export downloaded')).toBeInTheDocument()
    expect(screen.getByText('trips_all.csv')).toBeInTheDocument()
  })

  it('shows an error toast when CSV export fails', async () => {
    const exportError = new ApiError({
      status: 422,
      code: 'export_limit_exceeded',
      message: 'Too many rows to export',
    })
    api.downloadTripsCsv.mockRejectedValueOnce(exportError)
    renderApp()
    const user = userEvent.setup()

    await screen.findByText('Business')
    await user.click(screen.getByRole('button', { name: /export csv/i }))

    const described = describeExportError(exportError)
    const expectedDetail =
      typeof described === 'string'
        ? described
        : described?.detail || described?.message || 'Could not download CSV'

    expect(await screen.findByText(expectedDetail)).toBeInTheDocument()
    expect(saveBlob).not.toHaveBeenCalled()
  })

  it('switches theme from the header', async () => {
    renderApp()
    const user = userEvent.setup()
    await screen.findByText(SALES_HEADLINE)
    const before = document.documentElement.classList.contains('dark')
    await user.click(screen.getByRole('button', { name: /switch to (dark|light) theme/i }))
    expect(document.documentElement.classList.contains('dark')).toBe(!before)
  })
})