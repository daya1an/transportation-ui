import { useMemo, useState } from 'react'
import { Chart } from 'primereact/chart'
import { SelectButton } from 'primereact/selectbutton'
import { Skeleton } from 'primereact/skeleton'
import ErrorPanel from '../../../components/ErrorPanel'
import { buildChartModel } from './chartModel'

const METRIC_OPTIONS = [
  { label: 'Sales', value: 'sales' },
  { label: 'Trips', value: 'trips' },
]

const SKELETON_BARS = ['45%', '70%', '55%', '85%', '65%', '75%']

function ChartSkeleton() {
  return (
    <div
      data-testid="chart-skeleton"
      aria-busy="true"
      aria-label="Loading chart"
      className="flex h-full flex-col justify-between gap-4 rounded-xl border border-line/60 bg-surface/40 p-4"
    >
      <div className="flex justify-end gap-3">
        <Skeleton width="4.5rem" height="0.75rem" />
        <Skeleton width="4.5rem" height="0.75rem" />
      </div>
      <div className="flex flex-1 items-end justify-around gap-3 pt-4">
        {SKELETON_BARS.map((height, index) => (
          <div key={index} className="flex h-full w-full max-w-12 items-end">
            <Skeleton width="100%" height={height} borderRadius="0.375rem" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CategoryChart({
  response,
  granularity = 'monthly',
  mode = 'dark',
  loading = false,
  refreshing = false,
  error = null,
  onRetry,
  title = 'Performance by passenger category',
  subtitle,
}) {
  const [metric, setMetric] = useState('sales')

  const model = useMemo(
    () => buildChartModel(response, { metric, mode, granularity }),
    [response, metric, mode, granularity]
  )

  const hasData = model.data.labels.length > 0 && model.data.datasets.length > 0

  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-line bg-card p-4 shadow-sm"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-fg">{title}</h2>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>

        <SelectButton
          value={metric}
          options={METRIC_OPTIONS}
          onChange={(e) => {
            if (e.value) setMetric(e.value)
          }}
          allowEmpty={false}
          disabled={loading || Boolean(error)}
          aria-label="Chart metric"
        />
      </div>

      {error ? (
        <ErrorPanel
          title="Could not load chart"
          error={error}
          onRetry={onRetry}
          compact
        />
      ) : (
        <div
          data-refreshing={refreshing ? 'true' : 'false'}
          className={`relative h-72 w-full transition-opacity sm:h-80 ${
            refreshing ? 'opacity-70' : ''
          }`}
        >
          {loading ? (
            <ChartSkeleton />
          ) : hasData ? (
            <Chart
              key={mode}
              type="bar"
              data={model.data}
              options={model.options}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-line text-sm text-muted">
              No chart data for the selected filters.
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default CategoryChart