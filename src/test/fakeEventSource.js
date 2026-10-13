/** A controllable EventSource for tests: call open(), emit() and fail() to play the server's part. */
export class FakeEventSource {
  static instances = []

  static reset() {
    FakeEventSource.instances = []
  }

  constructor(url) {
    this.url = url
    this.closed = false
    this.listeners = {}
    FakeEventSource.instances.push(this)
  }

  addEventListener(type, fn) {
    ;(this.listeners[type] ??= []).push(fn)
  }

  close() {
    this.closed = true
  }

  open() {
    this.onopen?.()
  }

  fail() {
    this.onerror?.()
  }

  emit(type, data = '{}') {
    ;(this.listeners[type] ?? []).forEach((fn) => fn({ data }))
  }
}
