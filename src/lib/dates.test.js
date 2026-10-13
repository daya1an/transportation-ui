import { describe, expect, it } from 'vitest'
import { addDays, formatBucket, formatDate, isIsoDate, parseIso, toIso, windowEndingAt } from './dates'

describe('dates', () => {
  it('accepts real ISO dates only', () => {
    expect(isIsoDate('2025-12-27')).toBe(true)
    expect(isIsoDate('2024-02-29')).toBe(true) // leap day
    for (const bad of ['2025-02-30', '2025-13-01', '27/12/2025', '2025-1-5', '', null, undefined, 20251227]) {
      expect(isIsoDate(bad)).toBe(false)
    }
  })

  it('round-trips without a timezone shift', () => {
    expect(toIso(parseIso('2025-03-01'))).toBe('2025-03-01')
    expect(toIso(parseIso('2025-12-31'))).toBe('2025-12-31')
  })

  it('adds days across month and year boundaries', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01')
    expect(addDays('2025-03-01', -1)).toBe('2025-02-28')
    expect(addDays('2025-12-27', -29)).toBe('2025-11-28')
  })

  it('builds the default window the way the API does', () => {
    expect(windowEndingAt('2025-12-27', 30)).toEqual({ from: '2025-11-28', to: '2025-12-27' })
    expect(windowEndingAt('2025-12-27', 1)).toEqual({ from: '2025-12-27', to: '2025-12-27' })
  })

  it('labels chart buckets by zoom level', () => {
    expect(formatBucket('2025-06-03', 'weekly')).toBe('03 Jun')
    expect(formatBucket('2025-06-01', 'monthly')).toBe('Jun 2025')
    expect(formatBucket('2025-01-01', 'yearly')).toBe('2025')
  })

  it('formats a date for display', () => {
    expect(formatDate('2025-12-27')).toBe('27 Dec 2025')
    expect(formatDate(null)).toBe('-')
  })
})
