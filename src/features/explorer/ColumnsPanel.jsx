import { Skeleton } from 'primereact/skeleton'
import ErrorPanel from '../../components/ErrorPanel'

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5]

function normalizeColumn(col) {
  const name = col.name ?? col.col_name ?? col.column_name ?? ''
  const type = col.type ?? col.data_type ?? ''
  const nullable = typeof col.nullable === 'boolean' ? col.nullable : null
  const comment = col.comment ?? col.description ?? ''
  return { name, type, nullable, comment }
}

function ColumnsSkeleton() {
  return (
    <div
      data-testid="columns-skeleton"
      aria-busy="true"
      aria-label="Loading columns"
      className="space-y-3 rounded-xl border border-line/60 bg-surface/40 p-4"
    >
      {SKELETON_ROWS.map((row) => (
        <div key={row} className="grid grid-cols-3 gap-4">
          <Skeleton height="0.95rem" width="75%" />
          <Skeleton height="0.95rem" width="45%" />
          <Skeleton height="0.95rem" width="90%" />
        </div>
      ))}
    </div>
  )
}

export function ColumnsPanel({
  columns = [],
  tableName,
  loading = false,
  refreshing = false,
  error = null,
  onRetry,
  title = 'Columns',
}) {
  const items = columns.map(normalizeColumn)
  const hasComments = items.some((col) => Boolean(col.comment))

  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-line bg-card p-4 shadow-sm"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-fg">{title}</h2>
            {!loading && !error && (
              <span className="text-xs font-medium text-muted tabular-nums">
                {items.length} {items.length === 1 ? 'column' : 'columns'}
              </span>
            )}
          </div>
          {tableName && (
            <p className="truncate font-mono text-xs text-muted">{tableName}</p>
          )}
        </div>
      </div>

      {error ? (
        <ErrorPanel
          title="Could not load columns"
          error={error}
          onRetry={onRetry}
          compact
        />
      ) : loading ? (
        <ColumnsSkeleton />
      ) : items.length === 0 ? (
        <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-line text-sm text-muted">
          No columns available for this table.
        </div>
      ) : (
        <div
          data-testid="columns-table-wrap"
          data-refreshing={refreshing ? 'true' : 'false'}
          className={`overflow-x-auto transition-opacity ${
            refreshing ? 'opacity-70' : ''
          }`}
        >
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-4 font-medium">Column</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                {hasComments && <th className="py-2 font-medium">Description</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {items.map((col, index) => (
                <tr key={col.name || index} className="align-top">
                  <td className="py-2.5 pr-4 font-mono text-xs font-medium text-fg whitespace-nowrap">
                    {col.name || '-'}
                  </td>
                  <td className="py-2.5 pr-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-xs text-fg">
                        {col.type || '-'}
                      </span>
                      {col.nullable === false && (
                        <span className="text-[11px] font-medium text-muted">
                          not null
                        </span>
                      )}
                    </div>
                  </td>
                  {hasComments && (
                    <td className="py-2.5 text-xs text-muted">
                      {col.comment || '-'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default ColumnsPanel