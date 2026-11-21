import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, screen } from '@testing-library/react'
import * as api from '../../../api/endpoints'
import { ToastProvider } from '../../../components/ToastProvider'
import * as downloadLib from '../../../lib/download'
import { useCsvExport } from './useCsvExport'

vi.mock('../../../api/endpoints', () => ({
  downloadTripsCsv: vi.fn(),
}))

vi.mock('../../../lib/download', () => ({
  saveBlob: vi.fn(),
  describeExportError: vi.fn(),
}))

const FILTERS = { city: 'kochi', dateFrom: '2025-11-28', dateTo: '2025-12-27' }

const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>

beforeEach(() => {
  vi.resetAllMocks()
})

afterEach(cleanup)

describe('useCsvExport', () => {
  it('downloads the csv, saves the blob, and shows a success toast', async () => {
    const blob = new Blob(['id,sales_amt\n1,100'], { type: 'text/csv' })
    api.downloadTripsCsv.mockResolvedValue({ blob, filename: 'trips_kochi.csv' })

    const { result } = renderHook(() => useCsvExport(), { wrapper })

    let ok
    await act(async () => {
      ok = await result.current.exportCsv(FILTERS)
    })

    expect(ok).toBe(true)
    expect(api.downloadTripsCsv).toHaveBeenCalledWith(FILTERS, expect.any(AbortSignal))
    expect(downloadLib.saveBlob).toHaveBeenCalledWith(blob, 'trips_kochi.csv')
    expect(result.current.downloading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(screen.getByText('Export downloaded')).toBeTruthy()
    expect(screen.getByText('trips_kochi.csv')).toBeTruthy()
  })

  it('builds a fallback filename when the server omits one', async () => {
    const blob = new Blob(['id\n1'], { type: 'text/csv' })
    api.downloadTripsCsv.mockResolvedValue({ blob })

    const { result } = renderHook(() => useCsvExport(), { wrapper })

    await act(async () => {
      await result.current.exportCsv(FILTERS)
    })

    expect(downloadLib.saveBlob).toHaveBeenCalledWith(
      blob,
      'trips_kochi_2025-11-28_2025-12-27.csv'
    )
  })

  it('ignores duplicate export calls while a download is already running', async () => {
    let resolveDownload
    api.downloadTripsCsv.mockImplementation(
      () => new Promise((resolve) => { resolveDownload = resolve })
    )

    const { result } = renderHook(() => useCsvExport(), { wrapper })

    let firstPromise
    act(() => {
      firstPromise = result.current.exportCsv(FILTERS)
    })

    expect(result.current.downloading).toBe(true)

    let secondOk
    await act(async () => {
      secondOk = await result.current.exportCsv(FILTERS)
    })

    expect(secondOk).toBe(false)
    expect(api.downloadTripsCsv).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveDownload({ blob: new Blob(['ok']), filename: 'trips.csv' })
      await firstPromise
    })

    expect(result.current.downloading).toBe(false)
  })

  it('shows the described error toast when export fails', async () => {
    const err = new Error('Too many rows')
    api.downloadTripsCsv.mockRejectedValue(err)
    downloadLib.describeExportError.mockReturnValue('Narrow the date range and try again.')

    const { result } = renderHook(() => useCsvExport(), { wrapper })

    let ok
    await act(async () => {
      ok = await result.current.exportCsv(FILTERS)
    })

    expect(ok).toBe(false)
    expect(downloadLib.describeExportError).toHaveBeenCalledWith(err)
    expect(result.current.error).toBe('Narrow the date range and try again.')
    expect(screen.getByText('Could not download CSV')).toBeTruthy()
    expect(screen.getByText('Narrow the date range and try again.')).toBeTruthy()
  })

  it('does not show an error toast when the download is cancelled', async () => {
    const abortErr = new DOMException('Aborted', 'AbortError')
    api.downloadTripsCsv.mockRejectedValue(abortErr)

    const { result } = renderHook(() => useCsvExport(), { wrapper })

    let ok
    await act(async () => {
      ok = await result.current.exportCsv(FILTERS)
    })

    expect(ok).toBe(false)
    expect(downloadLib.describeExportError).not.toHaveBeenCalled()
    expect(result.current.error).toBeNull()
    expect(screen.queryByText('Could not download CSV')).toBeNull()
  })
})