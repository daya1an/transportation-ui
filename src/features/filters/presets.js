import { windowEndingAt } from '../../lib/dates'

export const PRESETS = [
  { key: '30d', label: '30 days', days: 30 },
  { key: '90d', label: '90 days', days: 90 },
  { key: 'all', label: 'All', days: null },
]

/** The date range a preset stands for, always ending at the latest data and never starting before the first. */
export function presetRange(preset, { minDate, maxDate }) {
  if (!minDate || !maxDate) return null
  if (preset.days === null) return { from: minDate, to: maxDate }
  const { from, to } = windowEndingAt(maxDate, preset.days)
  return { from: from < minDate ? minDate : from, to } // ISO dates compare correctly as plain strings
}

/** Which preset (if any) matches the current range, so its button can look selected. */
export function activePreset(range, bounds) {
  return (
    PRESETS.find((preset) => {
      const r = presetRange(preset, bounds)
      return r && r.from === range.from && r.to === range.to
    }) ?? null
  )
}
