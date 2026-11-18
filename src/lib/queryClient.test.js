import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/errors'
import { shouldRetry } from './queryClient'

const error = (status, code = 'x') => new ApiError({ status, code })

describe('shouldRetry', () => {
  it('never retries client errors', () => {
    for (const status of [400, 401, 404, 422, 429]) expect(shouldRetry(0, error(status))).toBe(false)
  })

  it('does not retry a paused warehouse, the page offers a Try again button instead', () => {
    expect(shouldRetry(0, error(503, 'warehouse_unavailable'))).toBe(false)
  })

  it('retries network and other server errors twice', () => {
    for (const e of [error(0, 'network_error'), error(502), error(503, 'busy')]) {
      expect(shouldRetry(0, e)).toBe(true)
      expect(shouldRetry(1, e)).toBe(true)
      expect(shouldRetry(2, e)).toBe(false)
    }
  })
})
