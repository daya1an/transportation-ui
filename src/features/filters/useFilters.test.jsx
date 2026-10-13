import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../../api/endpoints'
import { useFilters } from './useFilters'

vi.mock('../../api/endpoints')

const META = {
  cities: [{ key: 'all', label: 'All cities' }, { key: 'kochi', label: 'Kochi' }],
  min_date: '2025-08-01',
  max_date: '2025-12-27',
  default_window_days: 30,
  data_version: 'v@1.0',
}

function setup(url = '/') {
  const wrapper = ({ children }) => (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  const hook = renderHook(() => ({ f: useFilters(), search: useLocation().search }), { wrapper })
  return hook
}

beforeEach(() => {
  vi.resetAllMocks()
  api.getMeta.mockResolvedValue(META)
})

describe('useFilters', () => {
  it('is not ready until the meta data is known, then uses the API defaults', async () => {
    const { result } = setup()
    expect(result.current.f.ready).toBe(false)
    await waitFor(() => expect(result.current.f.ready).toBe(true))
    expect(result.current.f).toMatchObject({
      city: 'all', dateFrom: '2025-11-28', dateTo: '2025-12-27', granularity: 'monthly', minDate: '2025-08-01', maxDate: '2025-12-27',
    })
  })

  it('reads valid filters from the URL', async () => {
    const { result } = setup('/?city=kochi&from=2025-10-01&to=2025-10-31&g=weekly')
    await waitFor(() => expect(result.current.f.ready).toBe(true))
    expect(result.current.f).toMatchObject({ city: 'kochi', dateFrom: '2025-10-01', dateTo: '2025-10-31', granularity: 'weekly' })
  })

  it('ignores junk in the URL instead of breaking', async () => {
    const { result } = setup('/?city=atlantis&from=2025-02-30&to=nonsense&g=hourly')
    await waitFor(() => expect(result.current.f.ready).toBe(true))
    expect(result.current.f).toMatchObject({ city: 'all', dateFrom: '2025-11-28', dateTo: '2025-12-27', granularity: 'monthly' })
  })

  it('falls back to the default range when from is after to', async () => {
    const { result } = setup('/?from=2025-12-10&to=2025-12-01')
    await waitFor(() => expect(result.current.f.ready).toBe(true))
    expect(result.current.f.dateFrom).toBe('2025-11-28')
  })

  it('writes changes to the URL and drops values that equal the defaults', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.f.ready).toBe(true))

    act(() => result.current.f.setCity('kochi'))
    expect(result.current.search).toBe('?city=kochi')
    act(() => result.current.f.setRange('2025-10-01', '2025-10-31'))
    expect(result.current.f).toMatchObject({ city: 'kochi', dateFrom: '2025-10-01', dateTo: '2025-10-31' })
    act(() => result.current.f.setGranularity('weekly'))
    expect(result.current.search).toContain('g=weekly')

    act(() => result.current.f.setCity('all'))
    act(() => result.current.f.setGranularity('monthly'))
    expect(result.current.search).not.toContain('city')
    expect(result.current.search).not.toContain('g=')
  })

  it('reset clears every filter', async () => {
    const { result } = setup('/?city=kochi&from=2025-10-01&to=2025-10-31&g=weekly')
    await waitFor(() => expect(result.current.f.ready).toBe(true))
    act(() => result.current.f.reset())
    expect(result.current.search).toBe('')
    expect(result.current.f.city).toBe('all')
  })
})
