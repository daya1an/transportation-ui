import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { InputText } from 'primereact/inputtext'
import { Skeleton } from 'primereact/skeleton'
import ErrorPanel from '../../../components/ErrorPanel'
import { formatDate } from '../../../lib/dates'
import {
  formatCurrency,
  formatKm,
  formatNumber,
  formatRating,
} from '../../../lib/format'

const CATEGORY_BADGE =
  'inline-flex items-center rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-medium text-fg'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const SKELETON_ROWS = [0, 1, 2, 3, 4, 5]

function TableSkeleton() {
  return (
    <div
      data-testid="trips-skeleton"
      aria-busy="true"
      aria-label="Loading trips"
      className="space-y-3 rounded-xl border border-line/60 bg-surface/40 p-4"
    >
      {SKELETON_ROWS.map((row) => (
        <div key={row} className="grid grid-cols-7 gap-3">
          <Skeleton height="1rem" />
          <Skeleton height="1rem" />
          <Skeleton height="1rem" />
          <Skeleton height="1rem" />
          <Skeleton height="1rem" />
          <Skeleton height="1rem" />
          <Skeleton height="1rem" />
        </div>
      ))}
    </div>
  )
}

export function TripsTable({
  rows = [],
  total = 0,
  page = 1,
  pageSize = 25,
  sortBy = 'business_date',
  sortDir = 'desc',
  search = '',
  loading = false,
  refreshing = false,
  error = null,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onSearchChange,
  onRetry,
  headerActions,
  title = 'Trips',
  subtitle,
}) {
  const safePage = Math.max(1, Number(page) || 1)
  const safePageSize = Math.max(1, Number(pageSize) || 25)
  const first = (safePage - 1) * safePageSize
  const sortOrder = sortDir === 'asc' ? 1 : sortDir === 'desc' ? -1 : 0
  const controlsDisabled = loading || Boolean(error)

  const handlePage = (event) => {
    if (!onPageChange) return
    const nextPage =
      typeof event.page === 'number'
        ? event.page + 1
        : Math.floor(event.first / event.rows) + 1
    onPageChange(nextPage)
  }

  const handleSort = (event) => {
    if (!onSortChange || !event.sortField) return
    onSortChange({
      sortBy: event.sortField,
      sortDir: event.sortOrder === 1 ? 'asc' : 'desc',
    })
  }

  const emptyMessage = search.trim()
    ? 'No trips match your search.'
    : 'No trips match the selected filters.'

  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-line bg-card p-4 shadow-sm"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-fg">{title}</h2>
            {!loading && !error && (
              <span className="text-xs font-medium text-muted tabular-nums">
                {formatNumber(total)} {total === 1 ? 'trip' : 'trips'}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex items-center">
            <i
              className="pi pi-search pointer-events-none absolute left-3 text-xs text-muted"
              aria-hidden="true"
            />
            <InputText
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search city or category"
              aria-label="Search trips"
              disabled={controlsDisabled}
              className="w-52 py-1.5 pl-8 pr-8 text-sm sm:w-60"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => onSearchChange?.('')}
                disabled={controlsDisabled}
                className="absolute right-2 flex h-5 w-5 items-center justify-center rounded text-muted hover:text-fg"
              >
                <i className="pi pi-times text-xs" aria-hidden="true" />
              </button>
            )}
          </div>

          <label className="flex items-center gap-1.5 text-xs text-muted">
            <span>Rows</span>
            <select
              aria-label="Rows per page"
              value={safePageSize}
              disabled={controlsDisabled}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          {headerActions}
        </div>
      </div>

      {error ? (
        <ErrorPanel
          title="Could not load trips"
          error={error}
          onRetry={onRetry}
          compact
        />
      ) : loading ? (
        <TableSkeleton />
      ) : (
        <div
          data-testid="trips-table-wrap"
          data-refreshing={refreshing ? 'true' : 'false'}
          className={`overflow-x-auto transition-opacity ${
            refreshing ? 'opacity-70' : ''
          }`}
        >
          <DataTable
            value={rows}
            dataKey="id"
            lazy
            paginator
            first={first}
            rows={safePageSize}
            totalRecords={total}
            onPage={handlePage}
            sortField={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            size="small"
            stripedRows
            tableStyle={{ minWidth: '48rem' }}
            emptyMessage={emptyMessage}
          >
            <Column
              field="business_date"
              header="Date"
              sortable
              body={(row) => formatDate(row.business_date)}
              bodyClassName="whitespace-nowrap tabular-nums"
            />
            <Column
              field="city_name"
              header="City"
              sortable
              body={(row) => row.city_name || '-'}
            />
            <Column
              field="passenger_category"
              header="Category"
              sortable
              body={(row) => (
                <span className={CATEGORY_BADGE}>
                  {row.passenger_category || '-'}
                </span>
              )}
            />
            <Column
              field="distance_kms"
              header="Distance"
              sortable
              align="right"
              alignHeader="right"
              body={(row) => formatKm(row.distance_kms)}
              bodyClassName="whitespace-nowrap tabular-nums"
            />
            <Column
              field="sales_amt"
              header="Sales"
              sortable
              align="right"
              alignHeader="right"
              body={(row) => formatCurrency(row.sales_amt)}
              bodyClassName="whitespace-nowrap font-medium tabular-nums"
            />
            <Column
              field="passenger_rating"
              header="Passenger rating"
              sortable
              align="right"
              alignHeader="right"
              body={(row) => formatRating(row.passenger_rating)}
              bodyClassName="whitespace-nowrap tabular-nums"
            />
            <Column
              field="driver_rating"
              header="Driver rating"
              sortable
              align="right"
              alignHeader="right"
              body={(row) => formatRating(row.driver_rating)}
              bodyClassName="whitespace-nowrap tabular-nums"
            />
          </DataTable>
        </div>
      )}
    </section>
  )
}

export default TripsTable