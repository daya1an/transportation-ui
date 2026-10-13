import { useState } from 'react'
import { Calendar } from 'primereact/calendar'
import { SelectButton } from 'primereact/selectbutton'
import { parseIso, toIso } from '../../lib/dates'
import { activePreset, PRESETS, presetRange } from './presets'

/** Quick presets plus a calendar for custom ranges. */
export default function DateRangeFilter({ filters }) {
  const { dateFrom, dateTo, minDate, maxDate, setRange } = filters
  const [draft, setDraft] = useState(null) // while the user has picked only the first day of a range

  const bounds = { minDate, maxDate }
  const active = dateFrom && dateTo ? activePreset({ from: dateFrom, to: dateTo }, bounds) : null
  const value = draft ?? (dateFrom && dateTo ? [parseIso(dateFrom), parseIso(dateTo)] : null)

  const applyPreset = (key) => {
    const range = presetRange(PRESETS.find((p) => p.key === key), bounds)
    if (range) setRange(range.from, range.to)
  }

  const onCalendarChange = (event) => {
    const [start, end] = event.value ?? []
    if (start && end) {
      setDraft(null)
      setRange(toIso(start), toIso(end))
    } else {
      setDraft(event.value) // keep the half-finished selection visible until the second day is picked
    }
  }

  return (
    <>
      <SelectButton
        value={active?.key ?? null}
        onChange={(e) => e.value && applyPreset(e.value)}
        options={PRESETS}
        optionLabel="label"
        optionValue="key"
        aria-label="Quick date ranges"
      />
      <Calendar
        value={value}
        onChange={onCalendarChange}
        selectionMode="range"
        readOnlyInput
        showIcon
        hideOnRangeSelection
        dateFormat="dd M yy"
        minDate={minDate ? parseIso(minDate) : undefined}
        maxDate={maxDate ? parseIso(maxDate) : undefined}
        placeholder="Select dates"
        inputId="date-range"
        aria-label="Date range"
        className="w-full sm:w-72"
      />
    </>
  )
}
