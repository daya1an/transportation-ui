import { Skeleton } from 'primereact/skeleton'
import ErrorPanel from '../../../components/ErrorPanel'
import { KpiCard } from './KpiCard'

const GRID_CLASS = 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'
const SKELETON_SLOTS = [0, 1, 2, 3]

function KpiCardSkeleton() {
  return (
    <div
      data-testid="kpi-skeleton"
      className="flex flex-col justify-between gap-3 rounded-xl border border-line bg-card p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <Skeleton width="5.5rem" height="0.75rem" />
        <Skeleton shape="square" size="2rem" borderRadius="0.5rem" />
      </div>
      <div>
        <Skeleton width="7.5rem" height="1.75rem" />
      </div>
      <div>
        <Skeleton width="4.5rem" height="1.25rem" borderRadius="9999px" />
      </div>
    </div>
  )
}

export function KpiGrid({ cards, loading, refreshing, error, onRetry }) {
  if (error) {
    return (
      <ErrorPanel
        title="Could not load KPIs"
        error={error}
        onRetry={onRetry}
        compact
      />
    )
  }

  if (loading) {
    return (
      <section
        aria-label="Loading KPIs"
        aria-busy="true"
        className={GRID_CLASS}
      >
        {SKELETON_SLOTS.map((slot) => (
          <KpiCardSkeleton key={slot} />
        ))}
      </section>
    )
  }

  if (!cards?.length) {
    return null
  }

  return (
    <section
      aria-label="Key metrics"
      data-refreshing={refreshing ? 'true' : 'false'}
      className={`${GRID_CLASS} transition-opacity ${refreshing ? 'opacity-70' : ''}`}
    >
      {cards.map(({ key, ...card }) => (
        <KpiCard key={key} {...card} />
      ))}
    </section>
  )
}

export default KpiGrid