import { describe, expect, it } from 'vitest'
import { activePreset, PRESETS, presetRange } from './presets'

const BOUNDS = { minDate: '2025-08-01', maxDate: '2025-12-27' }
const byKey = (key) => PRESETS.find((p) => p.key === key)

describe('presetRange', () => {
  it('ends at the latest data and counts back the right number of days', () => {
    expect(presetRange(byKey('30d'), BOUNDS)).toEqual({ from: '2025-11-28', to: '2025-12-27' })
    expect(presetRange(byKey('90d'), BOUNDS)).toEqual({ from: '2025-09-29', to: '2025-12-27' })
  })

  it('"All" spans everything', () => {
    expect(presetRange(byKey('all'), BOUNDS)).toEqual({ from: '2025-08-01', to: '2025-12-27' })
  })

  it('never starts before the first day of data', () => {
    const short = { minDate: '2025-12-10', maxDate: '2025-12-27' }
    expect(presetRange(byKey('90d'), short)).toEqual({ from: '2025-12-10', to: '2025-12-27' })
  })

  it('returns null until the bounds are known', () => {
    expect(presetRange(byKey('30d'), { minDate: null, maxDate: null })).toBeNull()
  })
})

describe('activePreset', () => {
  it('finds the preset that matches the current range', () => {
    expect(activePreset({ from: '2025-11-28', to: '2025-12-27' }, BOUNDS).key).toBe('30d')
    expect(activePreset({ from: '2025-08-01', to: '2025-12-27' }, BOUNDS).key).toBe('all')
  })

  it('returns null for a custom range', () => {
    expect(activePreset({ from: '2025-10-01', to: '2025-10-31' }, BOUNDS)).toBeNull()
  })
})
