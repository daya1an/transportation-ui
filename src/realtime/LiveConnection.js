/**
 * Keeps one Server-Sent Events stream alive. Plain class (no React) so it is easy to test.
 *
 * Why a fresh EventSource per reconnect instead of the browser's automatic one: our URL carries a
 * short-lived ticket, and a stale ticket would be rejected forever. So on any error we close the
 * stream, ask `resolveUrl` for a new ticket and open a new connection after a backoff delay.
 */
export class LiveConnection {
  #resolveUrl
  #onRefresh
  #onStatus
  #EventSourceImpl
  #heartbeatTimeoutMs
  #maxBackoffMs
  #random

  #source = null
  #retryTimer = null
  #watchdog = null
  #attempt = 0
  #stopped = true
  #everConnected = false
  #lastSeen = 0
  #generation = 0
  #status = null

  constructor({
    resolveUrl,
    onRefresh = () => {},
    onStatus = () => {},
    EventSourceImpl = globalThis.EventSource,
    heartbeatTimeoutMs = 45_000, // the server sends a heartbeat every 15 seconds
    maxBackoffMs = 30_000,
    random = Math.random,
  }) {
    this.#resolveUrl = resolveUrl
    this.#onRefresh = onRefresh
    this.#onStatus = onStatus
    this.#EventSourceImpl = EventSourceImpl
    this.#heartbeatTimeoutMs = heartbeatTimeoutMs
    this.#maxBackoffMs = maxBackoffMs
    this.#random = random
  }

  start() {
    if (!this.#stopped) return
    this.#stopped = false
    this.#connect()
  }

  stop() {
    this.#stopped = true
    this.#generation += 1 // invalidates any connect still waiting for its ticket
    clearTimeout(this.#retryTimer)
    this.#teardown()
    this.#setStatus('idle')
  }

  #setStatus(status) {
    if (status === this.#status) return
    this.#status = status
    this.#onStatus(status)
  }

  async #connect() {
    const generation = ++this.#generation
    if (!this.#everConnected && this.#attempt === 0) this.#setStatus('connecting')

    let url
    try {
      url = await this.#resolveUrl()
    } catch {
      if (generation === this.#generation) this.#scheduleReconnect()
      return
    }
    if (this.#stopped || generation !== this.#generation) return

    const source = new this.#EventSourceImpl(url)
    this.#source = source

    source.onopen = () => {
      if (source !== this.#source) return
      this.#attempt = 0
      this.#touch()
      this.#setStatus('live')
      const wasReconnect = this.#everConnected
      this.#everConnected = true
      this.#startWatchdog()
      // Events may have been missed while we were away, so make the app refetch once
      if (wasReconnect) this.#onRefresh({ source: 'reconnect' })
    }
    source.addEventListener('refresh', (event) => {
      this.#touch()
      let payload = {}
      try {
        payload = JSON.parse(event.data)
      } catch {
        /* a malformed payload still means "refresh" */
      }
      this.#onRefresh(payload)
    })
    source.addEventListener('heartbeat', () => this.#touch())
    source.onerror = () => {
      if (source !== this.#source) return
      this.#scheduleReconnect()
    }
  }

  #touch() {
    this.#lastSeen = Date.now()
  }

  /** A silent proxy can drop the stream without an error event. No heartbeat for too long means dead. */
  #startWatchdog() {
    clearInterval(this.#watchdog)
    this.#watchdog = setInterval(() => {
      if (Date.now() - this.#lastSeen > this.#heartbeatTimeoutMs) this.#scheduleReconnect()
    }, 5_000)
  }

  #teardown() {
    clearInterval(this.#watchdog)
    this.#watchdog = null
    if (this.#source) {
      this.#source.onopen = null
      this.#source.onerror = null
      this.#source.close()
      this.#source = null
    }
  }

  #scheduleReconnect() {
    this.#teardown()
    if (this.#stopped) return
    clearTimeout(this.#retryTimer)
    this.#attempt += 1
    this.#setStatus(this.#attempt > 3 ? 'offline' : 'reconnecting')
    // Exponential backoff with jitter, so many tabs do not reconnect in lockstep
    const base = Math.min(this.#maxBackoffMs, 1000 * 2 ** (this.#attempt - 1))
    this.#retryTimer = setTimeout(() => {
      if (!this.#stopped) this.#connect()
    }, base * (0.5 + this.#random() * 0.5))
  }
}
