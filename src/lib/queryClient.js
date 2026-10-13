import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/errors'

/** Client errors (400 to 499) will not fix themselves, so only network and server errors are retried. */
export function shouldRetry(failureCount, error) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
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
