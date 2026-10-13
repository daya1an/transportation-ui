/** Every failed request becomes one of these, shaped like the backend's {code, message} bodies. */
export class ApiError extends Error {
  constructor({ status = 0, code = 'unknown_error', message = 'Something went wrong', retryAfter = null, requestId = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status // 0 means the server could not be reached
    this.code = code
    this.retryAfter = retryAfter // seconds, from the Retry-After header on 429 and 503
    this.requestId = requestId // quote this when debugging, it matches the server log line
  }

  get isNetwork() {
    return this.status === 0
  }
}
