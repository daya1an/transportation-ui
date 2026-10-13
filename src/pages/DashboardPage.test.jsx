import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../api/endpoints'
import { ApiError } from '../api/errors'
import AppRoutes from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { FakeEventSource } from '../test/fakeEventSource'
import { ThemeProvider } from '../theme/ThemeProvider'

vi.mock('../api/endpoints')

const META = {
  min_date: '2025-08-01',
  max_date: '2025-12-27',
  data_version: 'transportation.silver.trips@4.0',
  cities: [{ key: 'all' }, { key: 'kochi' }, { key: 'surat' }],
}
const KPIS = {
  total_sales: { value: 12345678.4 },
  total_trips: { value: 7 },
  total_distance_kms: { value: 50 },
  avg_passenger_rating: { value: 4.5 },
}

function renderApp() {
  return render(
    <ThemeProvider>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppRoutes />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  FakeEventSource.reset()
  vi.stubGlobal('EventSource', FakeEventSource)
  api.getAuthConfig.mockResolvedValue({ auth_required: false })
  api.getMeta.mockResolvedValue(META)
  api.getKpis.mockResolvedValue(KPIS)
})
afterEach(() => vi.unstubAllGlobals())

describe('dashboard shell and page', () => {
  it('shows data, theme switch and connection state, and no sign-out when auth is off', async () => {
    renderApp()
    expect(await screen.findByText(/through/i)).toHaveTextContent('Data from 2025-08-01 through 2025-12-27')
    expect(screen.getByText('2 cities')).toBeInTheDocument()
    expect(await screen.findByText('1,23,45,678')).toBeInTheDocument() // Indian digit grouping
    expect(screen.getByText('Connecting')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /switch to (dark|light) theme/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
  })

  it('shows the server error message when a query fails', async () => {
    api.getKpis.mockRejectedValue(new ApiError({ status: 502, code: 'query_failed', message: 'Data query failed' }))
    renderApp()
    expect(await screen.findByText('Data query failed')).toBeInTheDocument()
  })

  it('goes live, then refetches and logs the update when a refresh event arrives', async () => {
    renderApp()
    await screen.findByText('1,23,45,678')
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))

    act(() => FakeEventSource.instances[0].open())
    expect(await screen.findByText('Live')).toBeInTheDocument()
    expect(api.getKpis).toHaveBeenCalledTimes(1)

    api.getKpis.mockResolvedValue({ ...KPIS, total_trips: { value: 8 } })
    act(() => FakeEventSource.instances[0].emit('refresh', JSON.stringify({ source: 'webhook', tables: ['fact_trips_kochi'] })))

    await waitFor(() => expect(api.getKpis).toHaveBeenCalledTimes(2)) // invalidated and refetched
    expect(await screen.findByText(/webhook · fact_trips_kochi/)).toBeInTheDocument()
    expect(await screen.findByText('8')).toBeInTheDocument()
  })

  it('switches theme from the header', async () => {
    renderApp()
    const user = userEvent.setup()
    await screen.findByText('1,23,45,678')
    const before = document.documentElement.classList.contains('dark')
    await user.click(screen.getByRole('button', { name: /switch to (dark|light) theme/i }))
    expect(document.documentElement.classList.contains('dark')).toBe(!before)
  })
})
