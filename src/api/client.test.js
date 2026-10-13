import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildUrl, download, request, setUnauthorizedHandler } from './client'
import { ApiError } from './errors'
import { getToken, setToken } from '../features/auth/tokenStore'

const reply = (body, init = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' }, ...init })

let fetchMock
beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  setUnauthorizedHandler(null)
})
afterEach(() => vi.unstubAllGlobals())

describe('buildUrl', () => {
  it('skips empty values and keeps the rest', () => {
    const url = buildUrl('/api/trips', { city: 'kochi', search: '', page: 2, a: undefined, b: null })
    expect(url).toBe('http://localhost:8000/api/trips?city=kochi&page=2')
  })
})

describe('request', () => {
  it('sends the bearer token when there is one, and none otherwise', async () => {
    fetchMock.mockImplementation(async () => reply({ ok: true }))
    await request('/api/meta')
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined()

    setToken('abc')
    await request('/api/meta')
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer abc')

    await request('/auth/config', { auth: false })
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBeUndefined()
  })

  it('posts JSON bodies', async () => {
    fetchMock.mockResolvedValue(reply({ ok: true }))
    await request('/auth/login', { method: 'POST', body: { access_key: 'k' }, auth: false })
    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.body).toBe('{"access_key":"k"}')
  })

  it('turns a {code, message} body into an ApiError', async () => {
    fetchMock.mockResolvedValue(
      reply({ code: 'city_not_found', message: "Unknown city 'x'" }, { status: 404, headers: { 'X-Request-ID': 'rid-1' } }),
    )
    const error = await request('/api/kpis').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, code: 'city_not_found', message: "Unknown city 'x'", requestId: 'rid-1' })
  })

  it('falls back to the status when the body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('oops', { status: 500, statusText: 'Server Error' }))
    const error = await request('/api/kpis').catch((e) => e)
    expect(error).toMatchObject({ status: 500, code: 'http_500', message: 'Server Error' })
  })

  it('exposes Retry-After on a 429', async () => {
    fetchMock.mockResolvedValue(reply({ code: 'rate_limited', message: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '7' } }))
    const error = await request('/auth/login', { method: 'POST', body: {}, auth: false }).catch((e) => e)
    expect(error.retryAfter).toBe(7)
  })

  it('on 401 clears the token and calls the handler', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    setToken('abc')
    fetchMock.mockResolvedValue(reply({ code: 'unauthorized', message: 'Invalid or expired token' }, { status: 401 }))
    await expect(request('/api/meta')).rejects.toMatchObject({ status: 401 })
    expect(handler).toHaveBeenCalledOnce()
    expect(getToken()).toBeNull()
  })

  it('does not log out on a 401 from an unauthenticated call such as login', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    fetchMock.mockResolvedValue(reply({ code: 'unauthorized', message: 'Invalid access key' }, { status: 401 }))
    await expect(request('/auth/login', { method: 'POST', body: {}, auth: false })).rejects.toMatchObject({ status: 401 })
    expect(handler).not.toHaveBeenCalled()
  })

  it('maps a network failure to a friendly ApiError', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const error = await request('/api/meta').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 0, code: 'network_error', isNetwork: true })
  })

  it('lets aborts through untouched', async () => {
    const abort = new DOMException('aborted', 'AbortError')
    fetchMock.mockRejectedValue(abort)
    await expect(request('/api/meta')).rejects.toBe(abort)
  })
})

describe('download', () => {
  it('returns the blob, the server file name and the row count, and asks for CSV with the token', async () => {
    setToken('abc')
    fetchMock.mockResolvedValue(
      new Response('id,city\r\n1,Kochi', {
        status: 200,
        headers: { 'Content-Disposition': 'attachment; filename="trips_kochi_2025-11-01_2025-11-30.csv"', 'X-Total-Rows': '1' },
      }),
    )
    const result = await download('/api/export.csv', { params: { city: 'kochi' } })
    expect(result.filename).toBe('trips_kochi_2025-11-01_2025-11-30.csv')
    expect(result.totalRows).toBe(1)
    expect(await result.blob.text()).toBe('id,city\r\n1,Kochi')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/export.csv?city=kochi')
    expect(init.headers).toMatchObject({ Accept: 'text/csv', Authorization: 'Bearer abc' })
  })

  it('falls back to a default file name', async () => {
    fetchMock.mockResolvedValue(new Response('x', { status: 200 }))
    expect((await download('/api/export.csv')).filename).toBe('download.csv')
  })

  it('turns a 413 into an ApiError carrying the server explanation', async () => {
    fetchMock.mockResolvedValue(reply({ code: 'export_too_large', message: '356000 rows exceeds the 200000 row limit' }, { status: 413 }))
    await expect(download('/api/export.csv')).rejects.toMatchObject({ status: 413, code: 'export_too_large' })
  })
})
