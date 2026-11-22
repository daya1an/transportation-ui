import { Skeleton } from 'primereact/skeleton'
import EmptyState from '../../components/EmptyState'
import ErrorPanel from '../../components/ErrorPanel'
import { formatNumber } from '../../lib/format'

const SKELETON_ITEMS = [0, 1, 2, 3, 4, 5]

function normalizeTable(item) {
  const key = item.key ?? item.city ?? item.id ?? item.name ?? ''
  const label = item.label ?? item.city_name ?? item.name ?? key
  const tableName = item.table ?? item.table_name ?? item.full_name ?? ''
  const rowCount = item.row_count ?? item.rows ?? null
  return { key, label, tableName, rowCount }
}

function TableListSkeleton() {
  return (
    <div
      data-testid="table-list-skeleton"
      aria-busy="true"
      aria-label="Loading tables"
      className="space-y-2"
    >
      {SKELETON_ITEMS.map((item) => (
        <div
          key={item}
          className="rounded-xl border border-line/60 bg-surface/40 p-3"
        >
          <Skeleton width="55%" height="0.9rem" className="mb-2" />
          <Skeleton width="80%" height="0.7rem" />
        </div>
      ))}
    </div>
  )
}

export function TableList({
  tables = [],
  selectedKey = null,
  onSelect,
  loading = false,
  error = null,
  onRetry,
  title = 'Tables',
}) {
  const items = tables.map(normalizeTable)

  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-line bg-card p-4 shadow-sm"
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-fg">{title}</h2>
        {!loading && !error && (
          <span className="text-xs font-medium text-muted tabular-nums">
            {items.length} {items.length === 1 ? 'table' : 'tables'}
          </span>
        )}
      </div>

      {error ? (
        <ErrorPanel
          title="Could not load tables"
          error={error}
          onRetry={onRetry}
          compact
        />
      ) : loading ? (
        <TableListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon="pi-table"
          title="No tables available."
          description="Tables appear here once the warehouse responds."
          compact
        />
      ) : (
        <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1 lg:max-h-none lg:overflow-visible lg:pr-0">
          {items.map((item) => {
            const active = item.key === selectedKey
            return (
              <li key={item.key}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelect?.(item.key)}
                  className={`flex w-full items-start justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    active
                      ? 'border-accent bg-accent/10 text-fg'
                      : 'border-transparent bg-surface/40 text-fg hover:border-line hover:bg-surface'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <i
                        className={`pi pi-table text-xs ${
                          active ? 'text-accent' : 'text-muted'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate text-sm font-medium">
                        {item.label}
                      </span>
                    </div>
                    {item.tableName && (
                      <div className="mt-0.5 truncate pl-5 font-mono text-xs text-muted">
                        {item.tableName}
                      </div>
                    )}
                  </div>

                  {item.rowCount != null && (
                    <span className="shrink-0 text-xs text-muted tabular-nums">
                      {formatNumber(item.rowCount)}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default TableList