import { Message } from 'primereact/message'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useKpis, useMeta } from '../hooks/queries'
import { formatClock, formatNumber, formatRating } from '../format'
import { useLive } from '../realtime/LiveRefreshProvider'

const FILTERS = { city: 'all' } // the filter bar in the next step replaces this

function Panel({ title, children }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <h2 className="mb-3 text-sm font-medium text-muted">{title}</h2>
      {children}
    </section>
  )
}

function Loading() {
  return <ProgressSpinner style={{ width: '1.75rem', height: '1.75rem' }} strokeWidth="6" aria-label="Loading" />
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="text-xl font-semibold text-fg">{value}</div>
    </div>
  )
}

/** Placeholder for steps 1 to 3: proves auth, data fetching and live refresh work end to end. */
export default function DashboardPage() {
  const meta = useMeta('all')
  const kpis = useKpis(FILTERS)
  const { events } = useLive()

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel title="Data">
        {meta.isPending && <Loading />}
        {meta.isError && <Message severity="error" text={meta.error.message} />}
        {meta.data && (
          <div className="space-y-1 text-sm text-fg">
            <div>
              Data from <strong>{meta.data.min_date}</strong> through <strong>{meta.data.max_date}</strong>
            </div>
            <div>{meta.data.cities.filter((c) => c.key !== 'all').length} cities</div>
            <div className="break-all text-xs text-muted">Version {meta.data.data_version}</div>
          </div>
        )}
      </Panel>

      <Panel title="Totals for the latest period (preview)">
        {kpis.isPending && <Loading />}
        {kpis.isError && <Message severity="error" text={kpis.error.message} />}
        {kpis.data && (
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Sales" value={formatNumber(kpis.data.total_sales.value)} />
            <Stat label="Trips" value={formatNumber(kpis.data.total_trips.value)} />
            <Stat label="Distance (km)" value={formatNumber(kpis.data.total_distance_kms.value)} />
            <Stat label="Passenger rating" value={formatRating(kpis.data.avg_passenger_rating.value)} />
          </div>
        )}
      </Panel>

      <div className="md:col-span-2">
        <Panel title="Live updates">
          {events.length === 0 ? (
            <p className="text-sm text-muted">Waiting for the next data refresh. New data appears here the moment it lands.</p>
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
