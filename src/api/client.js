import { API_BASE_URL } from '../lib/config'
import { clearToken, getToken } from '../features/auth/tokenStore'
import { ApiError } from './errors'

let unauthorizedHandler = null

/** AuthProvider registers here, so any 401 anywhere logs the user out in one place. */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

export function buildUrl(path, params) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') query.append(key, String(value))
  }
  const qs = query.toString()
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`
}

async function toApiError(response) {
  let body = null
  try {
    body = await response.json()
  } catch {
    /* not JSON, fall back to the status text */
  }
  const retryAfter = Number(response.headers.get('Retry-After'))
  return new ApiError({
    status: response.status,
    code: body?.code ?? `http_${response.status}`,
    message: body?.message ?? (response.statusText || 'Request failed'),
    retryAfter: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
    requestId: response.headers.get('X-Request-ID'),
  })
}

/**
 * Sends a request and returns the successful Response. Failures become ApiErrors.
 * `auth: false` is for login and config calls that must not trigger the logout-on-401 flow.
 * Aborted requests rethrow AbortError untouched, because cancelling a query is not an error to show.
 */
async function send(path, { method = 'GET', params, body, signal, auth = true, accept = 'application/json' } = {}) {
  const headers = { Accept: accept }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError({ status: 0, code: 'network_error', message: 'Cannot reach the server. Check your connection.' })
  }

  if (response.ok) return response

  const apiError = await toApiError(response)
  if (response.status === 401 && auth) {
    clearToken()
    unauthorizedHandler?.()
  }
  throw apiError
}

/** JSON request helper. */
export async function request(path, options) {
  const response = await send(path, options)
  return response.status === 204 ? null : response.json()
}

/** File download helper. Returns the blob plus the file name and row count the server reported. */
export async function download(path, options) {
  const response = await send(path, { ...options, accept: 'text/csv' })
  const disposition = response.headers.get('Content-Disposition') ?? ''
  return {
    blob: await response.blob(),
    filename: /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'download.csv',
    totalRows: Number(response.headers.get('X-Total-Rows')) || null,
  }
}
