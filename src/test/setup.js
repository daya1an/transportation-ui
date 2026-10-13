import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom has no matchMedia
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false, media: query, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false,
  })
}

// jsdom has no EventSource. A silent stub keeps components that open a stream from crashing.
class StubEventSource {
  constructor(url) {
    this.url = url
  }
  addEventListener() {}
  close() {}
}
globalThis.EventSource ??= StubEventSource

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  localStorage.clear()
  document.documentElement.className = ''
  document.documentElement.removeAttribute('style')
})
