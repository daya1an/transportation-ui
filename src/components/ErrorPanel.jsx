import { Button } from 'primereact/button'

/**
 * Friendly failure block with a Retry button. Shows the server's own explanation when it gave one.
 * `compact` drops the card chrome, for use inside another card.
 */
export default function ErrorPanel({ error, onRetry, title = 'Could not load data', compact = false }) {
  const warehouseDown = error?.code === 'warehouse_unavailable'
  return (
    <div
      role="alert"
      className={`flex flex-col items-start gap-3 sm:flex-row sm:items-center ${compact ? '' : 'rounded-2xl border border-line bg-card p-5'}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-lg text-amber-500">
        <i className={warehouseDown ? 'pi pi-server' : 'pi pi-exclamation-triangle'} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-fg">{warehouseDown ? 'The data warehouse is not responding' : title}</h2>
        <p className="text-sm text-muted">{error?.message ?? 'Something went wrong.'}</p>
        {error?.retryAfter ? <p className="mt-1 text-xs text-muted">The server suggests waiting about {error.retryAfter} seconds.</p> : null}
        {/* The first 8 characters match the request id in the API log, which makes a failure easy to trace */}
        {error?.requestId ? <p className="mt-1 text-xs text-muted">Reference {error.requestId.slice(0, 8)}</p> : null}
      </div>
      {onRetry && <Button label="Try again" icon="pi pi-refresh" onClick={onRetry} outlined size="small" />}
    </div>
  )
}
