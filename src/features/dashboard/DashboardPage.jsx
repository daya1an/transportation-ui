import { useEffect, useState } from 'react'
import { ProgressSpinner } from 'primereact/progressspinner'
import ErrorPanel from '../../components/ErrorPanel'
import { useChart, useKpis, useMix, useTrips } from '../../hooks/queries'
import PageHeader from '../../layout/PageHeader'
import { formatClock } from '../../lib/format'
import FilterBar from '../filters/FilterBar'
import { useFilters } from '../filters/useFilters'
import { useLive } from '../realtime/LiveRefreshProvider'
import { useTheme } from '../theme/ThemeProvider'
import { CategoryChart } from './charts/CategoryChart'
import { MixPanel } from './charts/MixPanel'
import { buildKpiCards } from './kpi/kpiModel'
import { KpiGrid } from './kpi/KpiGrid'
import { TripsTable } from './trips/TripsTable'

function Panel({ title, children }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <h2 className="mb-3 text-sm font-medium text-muted">{title}</h2>
      {children}
    </section>
  )
}

const Loading = () => (
  <ProgressSpinner
    style={{ width: '1.75rem', height: '1.75rem' }}
    strokeWidth="6"
    aria-label="Loading"
  />
)

export default function DashboardPage() {
  const filters = useFilters()
  const { metaQuery: meta } = filters

  return (
    <div className="space-y-5">
      <PageHeader
        overline="Overview"
        title="Trips dashboard"
        subtitle="Trips, sales and ratings across cities, refreshed the moment new data lands."
      />

      {meta.isError ? (
        <ErrorPanel error={meta.error} onRetry={() => meta.refetch()} />
      ) : (
        <>
          <FilterBar filters={filters} />
          <DashboardBody />
        </>
      )}
    </div>
  )
}

function DashboardBody() {
  const filters = useFilters()
  const { metaQuery: meta, city, dateFrom, dateTo, granularity, ready } = filters
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sort, setSort] = useState({ sortBy: 'business_date', sortDir: 'desc' })
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [city, dateFrom, dateTo])

  const filterArgs = { city, dateFrom, dateTo }
  const kpis = useKpis(filterArgs, { enabled: ready })
  const chart = useChart(filterArgs, granularity, { enabled: ready })
  const mix = useMix(filterArgs, { enabled: ready })
  const trips = useTrips(
    filterArgs,
    {
      page,
      pageSize,
      sortBy: sort.sortBy,
      sortDir: sort.sortDir,
      search: search || undefined,
    },
    { enabled: ready }
  )
  const { events } = useLive()
  const themeState = useTheme()
  const mode = themeState?.mode ?? themeState?.theme ?? 'dark'
  const cityLabel = filters.cities.find((c) => c.key === city)?.label ?? 'All cities'

  const cards = kpis.data ? buildKpiCards(kpis.data) : []
  const kpiLoading = !ready || kpis.isPending
  const kpiRefreshing = kpis.isFetching && !kpis.isPending

  const chartLoading = !ready || chart.isPending
  const chartRefreshing = chart.isFetching && !chart.isPending

  const mixLoading = !ready || mix.isPending
  const mixRefreshing = mix.isFetching && !mix.isPending
  const mixSubtitle = ready
    ? city === 'all'
      ? 'By city'
      : `${cityLabel} by passenger category`
    : undefined

  const tripRows = trips.data?.items ?? trips.data?.rows ?? []
  const tripTotal = trips.data?.total ?? tripRows.length
  const tripsLoading = !ready || trips.isPending
  const tripsRefreshing = trips.isFetching && !trips.isPending
  
  return (
    <div className="space-y-5">
      <KpiGrid
        cards={cards}
        loading={kpiLoading}
        refreshing={kpiRefreshing}
        error={kpis.isError ? kpis.error : null}
        onRetry={() => kpis.refetch()}
      />

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-7">
          <CategoryChart
            response={chart.data}
            granularity={granularity}
            mode={mode}
            loading={chartLoading}
            refreshing={chartRefreshing}
            error={chart.isError ? chart.error : null}
            onRetry={() => chart.refetch()}
            subtitle={ready ? cityLabel : undefined}
          />
        </div>

        <div className="min-w-0 xl:col-span-5">
          <MixPanel
            response={mix.data}
            mode={mode}
            loading={mixLoading}
            refreshing={mixRefreshing}
            error={mix.isError ? mix.error : null}
            onRetry={() => mix.refetch()}
            subtitle={mixSubtitle}
          />
        </div>
      </div>

      <TripsTable
        rows={tripRows}
        total={tripTotal}
        page={page}
        pageSize={pageSize}
        sortBy={sort.sortBy}
        sortDir={sort.sortDir}
        search={searchInput}
        loading={tripsLoading}
        refreshing={tripsRefreshing}
        error={trips.isError ? trips.error : null}
        onPageChange={setPage}
        onPageSizeChange={(nextSize) => {
          setPageSize(nextSize)
          setPage(1)
        }}
        onSortChange={(nextSort) => {
          setSort(nextSort)
          setPage(1)
        }}
        onSearchChange={setSearchInput}
        onRetry={() => trips.refetch()}
        subtitle={ready ? cityLabel : undefined}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Data">
          {meta.isPending && <Loading />}
          {meta.data && (
            <div className="space-y-1 text-sm text-fg">
              <div>
                Data from <strong>{meta.data.min_date}</strong> through{' '}
                <strong>{meta.data.max_date}</strong>
              </div>
              <div>
                {meta.data.cities.filter((c) => c.key !== 'all').length} cities
              </div>
              <div className="break-all text-xs text-muted">
                Version {meta.data.data_version}
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Live updates">
          {events.length === 0 ? (
            <p className="text-sm text-muted">
              Waiting for the next data refresh. New data appears here the moment
              it lands.
            </p>
          ) : (
            <ul className="space-y-1 text-sm text-fg">
              {events.map((event) => (
                <li key={event.receivedAt}>
                  {formatClock(event.receivedAt)} · {event.source ?? 'refresh'}
                  {event.tables?.length ? ` · ${event.tables.join(', ')}` : ''}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}