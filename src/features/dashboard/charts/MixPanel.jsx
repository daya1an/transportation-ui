import { useMemo } from 'react'
import { Chart } from 'primereact/chart'
import { Skeleton } from 'primereact/skeleton'
import ErrorPanel from '../../../components/ErrorPanel'
import {
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
} from '../../../lib/format'
import { groupMix } from './groupMix'
import { colorAt } from './palette'

const COMPACT_THRESHOLD = 100_000
const SKELETON_ROWS = [0, 1, 2, 3, 4]

const THEME = {
  dark: {
    cardBg: '#0b1324',
    other: '#475569',
    tooltipBg: '#0b1324',
    tooltipText: '#e2e8f0',
    border: '#1c2842',
  },
  light: {
    cardBg: '#ffffff',
    other: '#94a3b8',
    tooltipBg: '#ffffff',
    tooltipText: '#0f172a',
    border: '#e2e8f0',
  },
}

function formatMoneyHeadline(value) {
  return value != null && Math.abs(Number(value)) >= COMPACT_THRESHOLD
    ? formatCurrencyCompact(value)
    : formatCurrency(value)
}

function formatShare(value) {
  const num = Number(value)
  return Number.isFinite(num) ? `${num.toFixed(1)}%` : '0.0%'
}

function MixSkeleton() {
  return (
    <div
      data-testid="mix-skeleton"
      aria-busy="true"
      aria-label="Loading sales mix"
      className="flex flex-col gap-5 sm:flex-row sm:items-center"
    >
      <div className="mx-auto shrink-0">
        <Skeleton shape="circle" size="11rem" />
      </div>
      <div className="flex-1 space-y-3">
        {SKELETON_ROWS.map((row) => (
          <div key={row} className="flex items-center justify-between gap-3">
            <Skeleton width="7rem" height="0.85rem" />
            <Skeleton width="4.5rem" height="0.85rem" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function MixPanel({
  response,
  mode = 'dark',
  loading = false,
  refreshing = false,
  error = null,
  onRetry,
  title = 'Sales mix',
  subtitle,
}) {
  const theme = THEME[mode] ?? THEME.dark

  const { slices, colors, totalSales, chartData, chartOptions } = useMemo(() => {
    const rawItems = response?.items ?? []
    const grouped = groupMix(rawItems)
    const sliceColors = grouped.map((item, index) =>
      item.isOther ? theme.other : colorAt(mode, index)
    )
    const total = grouped.reduce((sum, item) => sum + Number(item.sales ?? 0), 0)

    const data = {
      labels: grouped.map((item) => item.label),
      datasets: [
        {
          data: grouped.map((item) => item.sales),
          backgroundColor: sliceColors,
          borderColor: theme.cardBg,
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    }

    const options = {
      maintainAspectRatio: false,
      cutout: '68%',
      animation: { duration: 250 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipText,
          bodyColor: theme.tooltipText,
          borderColor: theme.border,
          borderWidth: 1,
          callbacks: {
            label: (ctx) => {
              const slice = grouped[ctx.dataIndex]
              if (!slice) return ''
              return ` ${slice.label}: ${formatCurrency(slice.sales)} (${formatShare(slice.share_pct)})`
            },
          },
        },
      },
    }

    return {
      slices: grouped,
      colors: sliceColors,
      totalSales: total,
      chartData: data,
      chartOptions: options,
    }
  }, [response, mode, theme])

  const hasData = slices.length > 0

  return (
    <section
      aria-label={title}
      className="flex flex-col rounded-2xl border border-line bg-card p-4 shadow-sm"
    >
      <div className="mb-4">
        <h2 className="text-base font-semibold text-fg">{title}</h2>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>

      {error ? (
        <ErrorPanel
          title="Could not load sales mix"
          error={error}
          onRetry={onRetry}
          compact
        />
      ) : (
        <div
          data-refreshing={refreshing ? 'true' : 'false'}
          className={`flex-1 transition-opacity ${refreshing ? 'opacity-70' : ''}`}
        >
          {loading ? (
            <MixSkeleton />
          ) : hasData ? (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative mx-auto h-48 w-48 shrink-0">
                <Chart
                  key={mode}
                  type="doughnut"
                  data={chartData}
                  options={chartOptions}
                  className="h-full w-full"
                />
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] uppercase tracking-wide text-muted">
                    Total sales
                  </span>
                  <span
                    className="text-base font-semibold text-fg tabular-nums"
                    title={formatCurrency(totalSales)}
                  >
                    {formatMoneyHeadline(totalSales)}
                  </span>
                </div>
              </div>

              <ul className="min-w-0 flex-1 space-y-2.5">
                {slices.map((slice, index) => (
                  <li
                    key={slice.label}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: colors[index] }}
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-fg">
                          {slice.label}
                        </div>
                        <div className="text-xs text-muted tabular-nums">
                          {formatNumber(slice.trips)} trips
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right tabular-nums">
                      <div
                        className="font-medium text-fg"
                        title={formatCurrency(slice.sales)}
                      >
                        {formatMoneyHeadline(slice.sales)}
                      </div>
                      <div className="text-xs text-muted">
                        {formatShare(slice.share_pct)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-line text-sm text-muted">
              No sales mix data for the selected filters.
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default MixPanel