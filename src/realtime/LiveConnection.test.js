import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeEventSource } from '../test/fakeEventSource'
import { LiveConnection } from './LiveConnection'

function make(extra = {}) {
  const statuses = []
  const refreshes = []
  let ticket = 0
  const resolveUrl = vi.fn(async () => `http://api/events?ticket=t${++ticket}`)
  const connection = new LiveConnection({
    resolveUrl,
    onRefresh: (payload) => refreshes.push(payload),
    onStatus: (status) => statuses.push(status),
    EventSourceImpl: FakeEventSource,
    random: () => 1, // no jitter, so delays are exact
    ...extra,
  })
  return { connection, statuses, refreshes, resolveUrl }
}
const tick = (ms = 0) => vi.advanceTimersByTimeAsync(ms)

beforeEach(() => {
  FakeEventSource.reset()
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

describe('LiveConnection', () => {
  it('connects with the resolved URL and reports live', async () => {
    const { connection, statuses, refreshes } = make()
    connection.start()
    await tick()
    expect(FakeEventSource.instances).toHaveLength(1)
    expect(FakeEventSource.instances[0].url).toBe('http://api/events?ticket=t1')
    FakeEventSource.instances[0].open()
    expect(statuses).toEqual(['connecting', 'live'])
    expect(refreshes).toEqual([]) // the first connect needs no catch-up refresh
  })

  it('passes refresh payloads on, and still refreshes on a malformed one', async () => {
    const { connection, refreshes } = make()
    connection.start()
    await tick()
    const source = FakeEventSource.instances[0]
    source.open()
    source.emit('refresh', JSON.stringify({ source: 'webhook', tables: ['fact_trips_kochi'] }))
    source.emit('refresh', 'not json')
    expect(refreshes).toEqual([{ source: 'webhook', tables: ['fact_trips_kochi'] }, {}])
  })

  it('reconnects with a NEW ticket after an error and asks the app to refetch once', async () => {
    const { connection, statuses, refreshes, resolveUrl } = make()
    connection.start()
    await tick()
    FakeEventSource.instances[0].open()
    FakeEventSource.instances[0].fail()

    expect(statuses.at(-1)).toBe('reconnecting')
    expect(FakeEventSource.instances[0].closed).toBe(true)
    await tick(999)
    expect(FakeEventSource.instances).toHaveLength(1) // still backing off
    await tick(1)
    expect(resolveUrl).toHaveBeenCalledTimes(2)
    expect(FakeEventSource.instances[1].url).toContain('ticket=t2')

    FakeEventSource.instances[1].open()
    expect(statuses.at(-1)).toBe('live')
    expect(refreshes).toEqual([{ source: 'reconnect' }])
  })

  it('backs off exponentially and reports offline after repeated failures', async () => {
    const { connection, statuses } = make()
    connection.start()
    await tick()
    FakeEventSource.instances[0].fail() // attempt 1, retry in 1s
    await tick(1000)
    FakeEventSource.instances[1].fail() // attempt 2, retry in 2s
    await tick(1999)
    expect(FakeEventSource.instances).toHaveLength(2)
    await tick(1)
    FakeEventSource.instances[2].fail() // attempt 3, retry in 4s
    await tick(4000)
    FakeEventSource.instances[3].fail() // attempt 4
    expect(statuses.at(-1)).toBe('offline')
  })

  it('retries when fetching the ticket fails', async () => {
    const resolveUrl = vi.fn().mockRejectedValueOnce(new Error('ticket failed')).mockResolvedValue('http://api/events?ticket=ok')
    const { connection, statuses } = make({ resolveUrl })
    connection.start()
    await tick()
    expect(statuses.at(-1)).toBe('reconnecting')
    expect(FakeEventSource.instances).toHaveLength(0)
    await tick(1000)
    expect(FakeEventSource.instances).toHaveLength(1)
  })

  it('treats a silent stream as dead, but heartbeats keep it alive', async () => {
    const { connection, statuses } = make()
    connection.start()
    await tick()
    const first = FakeEventSource.instances[0]
    first.open()

    await tick(40_000)
    first.emit('heartbeat')
    await tick(40_000)
    expect(first.closed).toBe(false) // 40s of silence is still fine

    await tick(15_000) // 55s since the last sign of life
    expect(first.closed).toBe(true)
    expect(statuses.at(-1)).toBe('reconnecting')
  })

  it('stop() closes the stream and cancels pending retries', async () => {
    const { connection, statuses } = make()
    connection.start()
    await tick()
    FakeEventSource.instances[0].open()
    FakeEventSource.instances[0].fail()
    connection.stop()
    await tick(60_000)
    expect(FakeEventSource.instances).toHaveLength(1)
    expect(statuses.at(-1)).toBe('idle')
  })

  it('stop() while the ticket is being fetched never opens a stream', async () => {
    let release
    const resolveUrl = vi.fn(() => new Promise((resolve) => (release = resolve)))
    const { connection } = make({ resolveUrl })
    connection.start()
    connection.stop()
    release('http://api/events?ticket=late')
    await tick()
    expect(FakeEventSource.instances).toHaveLength(0)
  })
})
