import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/errors'
import { describeExportError, saveBlob } from './download'

describe('describeExportError', () => {
  it('passes the server explanation through for a too-large export', () => {
    const error = new ApiError({ status: 413, code: 'export_too_large', message: '356000 rows exceeds the limit, narrow the date range' })
    expect(describeExportError(error)).toBe('356000 rows exceeds the limit, narrow the date range')
  })

  it('tells the user how long to wait after a rate limit', () => {
    expect(describeExportError(new ApiError({ status: 429, retryAfter: 9 }))).toBe('Too many downloads. Try again in 9 seconds.')
  })

  it('falls back to the error message', () => {
    expect(describeExportError(new ApiError({ status: 502, message: 'Data query failed' }))).toBe('Data query failed')
  })
})

describe('saveBlob', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    URL.createObjectURL = vi.fn(() => 'blob:fake')
    URL.revokeObjectURL = vi.fn()
  })
  afterEach(() => vi.useRealTimers())

  it('clicks a temporary download link, then cleans up', () => {
    const clicked = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      clicked.push({ href: this.href, download: this.download })
    })
    saveBlob(new Blob(['a,b']), 'trips.csv')
    expect(clicked).toEqual([{ href: 'blob:fake', download: 'trips.csv' }])
    expect(document.querySelector('a[download]')).toBeNull() // link removed again
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake')
  })
})
