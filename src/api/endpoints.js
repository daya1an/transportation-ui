// One function per backend endpoint. Components never build URLs themselves.
import { download, request } from './client'

// The UI speaks camelCase, the API speaks snake_case
const filterParams = ({ city, dateFrom, dateTo } = {}) => ({ city, date_from: dateFrom, date_to: dateTo })

export const getAuthConfig = (signal) => request('/auth/config', { auth: false, signal })
export const login = (accessKey) => request('/auth/login', { method: 'POST', body: { access_key: accessKey }, auth: false })
export const createSseTicket = () => request('/auth/sse-ticket', { method: 'POST' })

export const getMeta = (city = 'all', signal) => request('/api/meta', { params: { city }, signal })
export const getKpis = (filters, signal) => request('/api/kpis', { params: filterParams(filters), signal })
export const getChart = (filters, granularity, signal) =>
  request('/api/chart', { params: { ...filterParams(filters), granularity }, signal })
export const getMix = (filters, signal) => request('/api/mix', { params: filterParams(filters), signal })
export const getTrips = (filters, { page, pageSize, sortBy, sortDir, search } = {}, signal) =>
  request('/api/trips', {
    params: { ...filterParams(filters), page, page_size: pageSize, sort_by: sortBy, sort_dir: sortDir, search },
    signal,
  })
export const downloadTripsCsv = (filters, signal) => download('/api/export.csv', { params: filterParams(filters), signal })

export const getExplorerTables = (signal) => request('/api/explorer/tables', { signal })
export const getExplorerColumns = (city, signal) => request(`/api/explorer/tables/${encodeURIComponent(city)}/columns`, { signal })
export const getExplorerSample = (city, limit, signal) =>
  request(`/api/explorer/tables/${encodeURIComponent(city)}/sample`, { params: { limit }, signal })
