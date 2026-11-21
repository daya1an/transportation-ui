import { Button } from 'primereact/button'

export function EmptyState({
  icon = 'pi-inbox',
  title = 'No data available',
  description,
  actionLabel,
  onAction,
  compact = false,
  className = '',
}) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface/30 px-4 text-center ${
        compact ? 'min-h-36 py-5' : 'min-h-48 py-8'
      } ${className}`.trim()}
    >
      <span
        aria-hidden="true"
        className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-card text-base text-muted"
      >
        <i className={`pi ${icon}`} />
      </span>

      <p className="text-sm font-medium text-fg">{title}</p>

      {description && (
        <p className="mt-1 max-w-sm text-xs text-muted">{description}</p>
      )}

      {actionLabel && onAction && (
        <div className="mt-3">
          <Button
            type="button"
            label={actionLabel}
            size="small"
            outlined
            onClick={onAction}
          />
        </div>
      )}
    </div>
  )
}

export default EmptyState