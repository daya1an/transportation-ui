const DELTA_STYLES = {
    up: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    down: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    flat: 'bg-surface text-muted border border-line',
    none: 'bg-surface text-muted',
}

const DELTA_ICONS = {
    up: 'pi-arrow-up-right',
    down: 'pi-arrow-down-right',
    flat: 'pi-minus',
    none: null,
}

export function KpiCard({ label, icon, value, fullValue, subtext, delta }) {
    const iconClass = icon ? (icon.startsWith('pi ') ? icon : `pi ${icon}`) : null
    const direction = delta?.direction ?? 'none'
    const badgeStyle = DELTA_STYLES[direction] ?? DELTA_STYLES.none
    const deltaIcon = DELTA_ICONS[direction] ?? null

    return (
        <article className="flex flex-col justify-between gap-3 rounded-xl border border-line bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                    {label}
                </span>
                {iconClass && (
                    <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-accent"
                        aria-hidden="true"
                    >
                        <i className={`${iconClass} text-sm`} />
                    </span>
                )}
            </div>

            <div>
                <p
                    className="text-2xl font-semibold tracking-tight text-fg tabular-nums"
                    title={fullValue || undefined}
                >
                    {value}
                </p>
                {subtext && (
                    <p className="mt-1 text-xs text-muted">{subtext}</p>
                )}
            </div>

            {delta?.text && (
                <div className="flex items-center">
                    <span
                        data-testid="kpi-delta"
                        data-direction={direction}
                        title={delta.title || undefined}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyle}`}
                    >
                        {deltaIcon && (
                            <i className={`pi ${deltaIcon} text-[10px]`} aria-hidden="true" />
                        )}
                        <span>{delta.text}</span>
                    </span>
                </div>
            )}
        </article>
    )
}

export default KpiCard