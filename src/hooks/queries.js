// Data hooks. Filter objects are part of the query key, so changing a filter refetches automatically.
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import * as api from '../api/endpoints'

// While new data loads, keep showing the previous result instead of flashing empty
const smooth = { placeholderData: keepPreviousData }

export const useMeta = (city = 'all') =>
  useQuery({ queryKey: ['meta', city], queryFn: ({ signal }) => api.getMeta(city, signal) })

export const useKpis = (filters, options = {}) =>
  useQuery({ queryKey: ['kpis', filters], queryFn: ({ signal }) => api.getKpis(filters, signal), ...smooth, ...options })

export const useChart = (filters, granularity, options = {}) =>
  useQuery({
    queryKey: ['chart', filters, granularity],
    queryFn: ({ signal }) => api.getChart(filters, granularity, signal),
    ...smooth,
    ...options,
  })

export const useMix = (filters, options = {}) =>
  useQuery({ queryKey: ['mix', filters], queryFn: ({ signal }) => api.getMix(filters, signal), ...smooth, ...options })

export const useTrips = (filters, paging, options = {}) =>
  useQuery({
    queryKey: ['trips', filters, paging],
    queryFn: ({ signal }) => api.getTrips(filters, paging, signal),
    ...smooth,
    ...options,
  })

export const useExplorerTables = () => useQuery({ queryKey: ['explorer', 'tables'], queryFn: ({ signal }) => api.getExplorerTables(signal) })

export const useExplorerColumns = (city) =>
  useQuery({ queryKey: ['explorer', 'columns', city], queryFn: ({ signal }) => api.getExplorerColumns(city, signal), enabled: Boolean(city) })

export const useExplorerSample = (city, limit) =>
  useQuery({
    queryKey: ['explorer', 'sample', city, limit],
    queryFn: ({ signal }) => api.getExplorerSample(city, limit, signal),
    enabled: Boolean(city),
    placeholderData: keepPreviousData,
  })
