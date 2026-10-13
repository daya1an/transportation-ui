import LiveBadge from '../features/realtime/LiveBadge'

/** Title block at the top of a page. `actions` holds buttons such as Download. */
export default function PageHeader({ overline, title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted">
          {overline}
          <LiveBadge />
        </div>
        <h1 className="text-2xl font-semibold text-fg">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
