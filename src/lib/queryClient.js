import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/errors'

/**
 * Client errors (400 to 499) will not fix themselves, so only network and server errors are retried.
 * A paused warehouse is not retried either: the server already knows and says when to try again,
 * so the page shows a Try again button instead of hammering the API.
 */
export function shouldRetry(failureCount, error) {
  if (error instanceof ApiError) {
    if (error.status >= 400 && error.status < 500) return false
    if (error.code === 'warehouse_unavailable') return false
  }
  return failureCount < 2
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        // Data only changes when a load finishes, and the live stream invalidates queries then
        staleTime: 5 * 60_000,
        refetchOnWindowFocus: false,
      },
    },
  })
}
