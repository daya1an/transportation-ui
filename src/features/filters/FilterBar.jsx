import { Dropdown } from 'primereact/dropdown'
import { SelectButton } from 'primereact/selectbutton'
import DateRangeFilter from './DateRangeFilter'

const ZOOM_OPTIONS = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
]

/** Controls that drive every widget on the dashboard. State lives in the URL, see useFilters. */
export default function FilterBar({ filters }) {
  const { city, cities, granularity, setCity, setGranularity } = filters
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <SelectButton
        value={granularity}
        onChange={(e) => e.value && setGranularity(e.value)}
        options={ZOOM_OPTIONS}
        allowEmpty={false}
        aria-label="Chart zoom level"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Dropdown
          value={city}
          onChange={(e) => setCity(e.value)}
          options={cities}
          optionLabel="label"
          optionValue="key"
          aria-label="City"
          className="w-full sm:w-52"
        />
        <DateRangeFilter filters={filters} />
      </div>
    </div>
  )
}
