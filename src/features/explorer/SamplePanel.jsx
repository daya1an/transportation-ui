import { Skeleton } from 'primereact/skeleton'
import ErrorPanel from '../../components/ErrorPanel'

const LIMIT_OPTIONS = [10, 25, 50, 100]
const SKELETON_ROWS = [0, 1, 2, 3, 4]

function resolveColumns(columns, rows) {
  if (Array.isArray(columns) && columns.length > 0) {
    return columns.map((col) =>
      typeof col === 'string'
        ? col
        : col.name ?? col.col_name ?? col.column_name ?? ''
    )
  }
  const firstRow = rows[0]
  if (firstRow && !Array.isArray(firstRow) && typeof firstRow === 'object') {
    return Object.keys(firstRow)
  }
  return []
}

function readCell(row, colName, colIndex) {
  if (Array.isArray(row)) return row[colIndex]
  if (row && typeof row === 'object') return row[colName]
  return null
}

function formatCell(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function SampleSkeleton() {
  return (
    <div
      data-testid="sample-skeleton"
      aria-busy="true"
      aria-label="Loading sample rows"
      className="space-y-3 rounded-xl border border-line/60 bg-surface/40 p-4"
    >
      {SKELETON_ROWS.map((row) => (
        <div key={row} className="grid grid-cols-5 gap-3">
          <Skeleton height="0.95rem" />
          <Skeleton height="0.95rem" />
          <Skeleton height="0.95rem" />
          <Skeleton height="0.95rem" />
          <Skeleton height="0.95rem" />
        </div>
      ))}
    </div>
  )
}

export function SamplePanel({
  rows = [],
  columns = [],
  tableName,
  limit = 25,
  onLimitChange,
  loading = false,
  refreshing = false,
  error = null,
  onRetry,
  title = 'Sample rows',
}) {
  const safeRows = Array.isArray(rows) ? rows : []
  const resolvedColumns = resolveColumns(columns, safeRows)
  const controlsDisabled = loading || Boolean(error)

  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-line bg-card p-4 shadow-sm"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-fg">{title}</h2>
            {!loading && !error && (
              <span className="text-xs font-medium text-muted tabular-nums">
                {safeRows.length} {safeRows.length === 1 ? 'row' : 'rows'}
              </span>
            )}
          </div>
          {tableName && (
            <p className="truncate font-mono text-xs text-muted">{tableName}</p>
          )}
        </div>

        <label className="flex items-center gap-1.5 text-xs text-muted">
          <span>Limit</span>
          <select
            aria-label="Sample row limit"
            value={limit}
            disabled={controlsDisabled}
            onChange={(e) => onLimitChange?.(Number(e.target.value))}
            className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {LIMIT_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <ErrorPanel
          title="Could not load sample rows"
          error={error}
          onRetry={onRetry}
          compact
        />
      ) : loading ? (
        <SampleSkeleton />
      ) : safeRows.length === 0 || resolvedColumns.length === 0 ? (
        <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-line text-sm text-muted">
          No sample rows available for this table.
        </div>
      ) : (
        <div
          data-testid="sample-table-wrap"
          data-refreshing={refreshing ? 'true' : 'false'}
          className={`overflow-x-auto transition-opacity ${
            refreshing ? 'opacity-70' : ''
          }`}
        >
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                {resolvedColumns.map((colName) => (
                  <th
                    key={colName}
                    className="py-2 pr-4 font-mono font-medium whitespace-nowrap"
                  >
                    {colName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {safeRows.map((row, rowIndex) => (
                <tr key={row?.id ?? rowIndex} className="align-top">
                  {resolvedColumns.map((colName, colIndex) => {
                    const raw = readCell(row, colName, colIndex)
                    const text = formatCell(raw)
                    const isNumeric = typeof raw === 'number'
                    return (
                      <td
                        key={`${rowIndex}-${colName}`}
                        className={`py-2 pr-4 text-xs whitespace-nowrap ${
                          isNumeric ? 'tabular-nums' : ''
                        } ${text === null ? 'text-muted' : 'text-fg'}`}
                      >
                        {text ?? '-'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default SamplePanel