import { formatBucket } from '../../../lib/dates'
import { formatCompact, formatCurrency, formatCurrencyCompact, formatNumber } from '../../../lib/format'
import { colorAt } from './palette'

const THEME = {
  dark: { text: '#94a3b8', grid: '#1c2842', tooltipBg: '#0b1324', tooltipText: '#e2e8f0' },
  light: { text: '#64748b', grid: '#e2e8f0', tooltipBg: '#ffffff', tooltipText: '#0f172a' },
}

/**
 * Turns the API's chart response into Chart.js data and options. Pure, so it is easy to test.
 * Colors come from fixed per-theme tables instead of CSS variables, because a canvas cannot read CSS variables
 * and the new theme stylesheet may not have finished loading when the theme changes.
 */
export function buildChartModel(response, { metric = 'sales', mode = 'dark', granularity = 'monthly' } = {}) {
  const theme = THEME[mode] ?? THEME.dark
  const money = metric === 'sales'
  const fmtFull = money ? formatCurrency : formatNumber
  const fmtAxis = money ? formatCurrencyCompact : formatCompact

  const labels = (response?.buckets ?? []).map((bucket) => formatBucket(bucket, granularity))
  const datasets = (response?.series ?? []).map((series, index) => ({
    label: series.category,
    data: series[metric],
    backgroundColor: colorAt(mode, index),
    borderRadius: 4,
    borderSkipped: false,
    maxBarThickness: 44,
  }))

  const options = {
    maintainAspectRatio: false,
    animation: { duration: 250 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: { color: theme.text, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8 },
      },
      tooltip: {
        backgroundColor: theme.tooltipBg,
        titleColor: theme.tooltipText,
        bodyColor: theme.tooltipText,
        borderColor: theme.grid,
        borderWidth: 1,
        callbacks: {
          label: (item) => ` ${item.dataset.label}: ${fmtFull(item.parsed.y)}`,
          footer: (items) => (items.length > 1 ? `Total: ${fmtFull(items.reduce((sum, i) => sum + i.parsed.y, 0))}` : ''),
        },
      },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: theme.text, maxRotation: 0, autoSkip: true } },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: theme.grid },
        border: { display: false },
        ticks: { color: theme.text, callback: (value) => fmtAxis(value) },
      },
    },
  }
  return { data: { labels, datasets }, options }
}
